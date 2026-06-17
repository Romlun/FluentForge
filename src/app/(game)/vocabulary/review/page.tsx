'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { cn } from '@/lib/utils'
import { BookOpen, ChevronLeft, Volume2 } from 'lucide-react'
import { getDueWords, getReviewOptions, rateWord } from '../actions'
import type { ReviewOutcome, WordWithProgress } from '../actions'

interface ReviewState {
  queue: WordWithProgress[]
  sessionTotal: number
  rememberedCount: number
}

function formatTimeUntilDue(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 1) return 'very soon'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`

  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
}

export default function ReviewPage() {
  const [loading, setLoading] = useState(true)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<ReviewState>({
    queue: [],
    sessionTotal: 0,
    rememberedCount: 0,
  })
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isRating, setIsRating] = useState(false)
  const [nextDueTime, setNextDueTime] = useState<Date | null>(null)
  const [reviewTurn, setReviewTurn] = useState(0)

  const currentItem = state.queue[0]
  const correctAnswer = currentItem
    ? currentItem.word.translation?.trim() || currentItem.word.definition
    : ''
  const isRevealed = selectedOption !== null

  const fetchNextDueTime = useCallback(async () => {
    const allDueQuery = await fetch('/api/next-due-word')
    if (!allDueQuery.ok) return

    const data = await allDueQuery.json()
    if (data.nextDueAt) {
      setNextDueTime(new Date(data.nextDueAt))
    }
  }, [])

  useEffect(() => {
    const fetchDueWords = async () => {
      try {
        setLoading(true)
        const words = await getDueWords()
        setState({
          queue: words,
          sessionTotal: words.length,
          rememberedCount: 0,
        })

        if (words.length === 0) {
          await fetchNextDueTime()
        }
      } catch (err) {
        console.error('Failed to fetch due words:', err)
        setError('Failed to load review session. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchDueWords()
  }, [fetchNextDueTime])

  useEffect(() => {
    if (!currentItem) {
      setOptions([])
      setSelectedOption(null)
      return
    }

    let isCurrent = true

    const loadOptions = async () => {
      try {
        setOptionsLoading(true)
        setSelectedOption(null)
        const nextOptions = await getReviewOptions(currentItem.word.id, correctAnswer)
        if (isCurrent) {
          setOptions(nextOptions)
        }
      } catch (err) {
        console.error('Failed to load review options:', err)
        if (isCurrent) {
          setError('Failed to load answer choices. Please try again later.')
        }
      } finally {
        if (isCurrent) {
          setOptionsLoading(false)
        }
      }
    }

    loadOptions()

    return () => {
      isCurrent = false
    }
  }, [currentItem, correctAnswer, reviewTurn])

  const handlePlay = () => {
    if (currentItem?.word.audio_url) {
      new Audio(currentItem.word.audio_url).play().catch(() => {})
    }
  }

  const handleSelectOption = (option: string) => {
    if (isRevealed || optionsLoading || isRating) return
    setSelectedOption(option)
  }

  const handleRate = async (outcome: ReviewOutcome) => {
    if (isRating || !currentItem || !isRevealed) return

    try {
      setIsRating(true)
      await rateWord(currentItem.progress.word_id, outcome)

      setState((prev) => {
        const [, ...rest] = prev.queue
        const shouldRequeue = outcome !== 'remember'
        const nextQueue = shouldRequeue ? [...rest, currentItem] : rest
        const rememberedCount =
          outcome === 'remember' ? prev.rememberedCount + 1 : prev.rememberedCount

        if (nextQueue.length === 0) {
          fetchNextDueTime().catch(() => {})
        }

        return {
          queue: nextQueue,
          sessionTotal: prev.sessionTotal,
          rememberedCount,
        }
      })
      setReviewTurn((prev) => prev + 1)
    } catch (err) {
      console.error('Failed to rate word:', err)
    } finally {
      setIsRating(false)
    }
  }

  const renderHeader = () => (
    <header className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Review
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Exit
        </Link>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Review session {state.rememberedCount} / {state.sessionTotal}
        </p>
        <ProgressBar value={state.rememberedCount} max={Math.max(1, state.sessionTotal)} />
      </div>
    </header>
  )

  if (loading) {
    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5">
          {renderHeader()}
          <div className="rounded-2xl border bg-card p-6 space-y-4 animate-pulse">
            <div className="h-10 w-48 mx-auto rounded bg-muted" />
            <div className="h-4 w-28 mx-auto rounded bg-muted" />
            <div className="h-5 w-20 mx-auto rounded-full bg-muted" />
            <div className="border-t pt-5 space-y-3">
              <div className="h-4 w-52 mx-auto rounded bg-muted" />
              <div className="h-12 rounded-lg bg-muted" />
              <div className="h-12 rounded-lg bg-muted" />
              <div className="h-12 rounded-lg bg-muted" />
              <div className="h-12 rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5">
          {renderHeader()}
          <EmptyState
            icon={<BookOpen className="size-6" />}
            heading="Review unavailable"
            description={error}
          />
        </div>
      </main>
    )
  }

  if (!currentItem) {
    const isSessionComplete = state.sessionTotal > 0

    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5">
          {renderHeader()}
          <EmptyState
            icon={<BookOpen className="size-6" />}
            heading={isSessionComplete ? 'Review session complete' : 'Nothing due right now'}
            description={
              nextDueTime
                ? `Next word available in ${formatTimeUntilDue(nextDueTime)}.`
                : isSessionComplete
                  ? 'Nice work. Check back later for your next reviews.'
                  : 'Check back later for words to review.'
            }
            action={
              <Link href="/vocabulary">
                <Button variant="outline" size="sm">Back to vocabulary</Button>
              </Link>
            }
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 pb-24 sm:p-8">
      <div className="max-w-lg mx-auto space-y-5">
        {renderHeader()}

        <section className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-6 pt-6 pb-4 text-center space-y-1.5">
            <h1 className="font-display text-4xl font-bold tracking-tight">
              {currentItem.word.word}
            </h1>
            {currentItem.word.phonetic && (
              <p className="text-sm text-muted-foreground">{currentItem.word.phonetic}</p>
            )}
            <div className="flex items-center justify-center gap-2 pt-1">
              {currentItem.word.part_of_speech && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {currentItem.word.part_of_speech}
                </span>
              )}
              <button
                type="button"
                onClick={handlePlay}
                disabled={!currentItem.word.audio_url}
                className={cn(
                  'flex items-center justify-center size-7 rounded-full transition-colors',
                  currentItem.word.audio_url
                    ? 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    : 'text-muted-foreground/40 cursor-default'
                )}
                aria-label={currentItem.word.audio_url ? 'Play pronunciation' : 'Audio unavailable'}
              >
                <Volume2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="mx-6 border-t" />

          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-medium text-center text-muted-foreground">
              Choose the correct translation
            </p>

            <div className="space-y-2.5">
              {optionsLoading ? (
                <>
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                </>
              ) : (
                options.map((option) => {
                  const isSelected = selectedOption === option
                  const isCorrect = option === correctAnswer
                  const shouldShowCorrect = isRevealed && isCorrect
                  const shouldShowWrong = isRevealed && isSelected && !isCorrect

                  return (
                    <Button
                      key={option}
                      type="button"
                      variant="outline"
                      onClick={() => handleSelectOption(option)}
                      disabled={isRevealed || isRating}
                      className={cn(
                        'min-h-12 h-auto w-full justify-start whitespace-normal px-4 py-3 text-left',
                        'disabled:pointer-events-none disabled:opacity-100',
                        shouldShowCorrect &&
                          'border-emerald-500/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                        shouldShowWrong &&
                          'border-destructive/70 bg-destructive/10 text-destructive'
                      )}
                    >
                      {option}
                    </Button>
                  )
                })
              )}
            </div>

            {isRevealed && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  How did that feel?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRate('forgot')}
                    disabled={isRating}
                  >
                    I forgot
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRate('need_practice')}
                    disabled={isRating}
                  >
                    Need practice
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRate('remember')}
                    disabled={isRating}
                  >
                    I remember
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
