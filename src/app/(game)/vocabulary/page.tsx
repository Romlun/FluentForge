'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { FlashCard } from './FlashCard'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { addWord, markKnown, getTodayAddedCount, getWordStatuses, getDueWords } from './actions'
import type { Word } from '@/types'

interface WordStatusMap {
  [wordId: number]: { status: 'learning' | 'known'; step: number }
}

function WordSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
      <div className="rounded-2xl border bg-card p-6 space-y-4 animate-pulse">
        <div className="h-10 w-48 mx-auto rounded bg-muted" />
        <div className="h-4 w-32 mx-auto rounded bg-muted" />
        <div className="h-5 w-20 mx-auto rounded-full bg-muted" />
        <div className="border-t pt-4 space-y-2">
          <div className="h-6 w-36 mx-auto rounded bg-muted" />
          <div className="h-4 w-56 mx-auto rounded bg-muted" />
          <div className="h-4 w-48 mx-auto rounded bg-muted" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-10 flex-1 rounded-lg bg-muted" />
          <div className="h-10 flex-1 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}

export default function VocabularyPage() {
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wordStatuses, setWordStatuses] = useState<WordStatusMap>({})
  const [todayCount, setTodayCount] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(10)
  const [actionLoading, setActionLoading] = useState(false)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: wordData, error: fetchError } = await supabase
          .from('words')
          .select('*')
          .order('frequency_rank', { ascending: true })

        if (fetchError) throw fetchError

        setWords(wordData || [])

        const statuses = await getWordStatuses()
        setWordStatuses(statuses)

        const count = await getTodayAddedCount()
        setTodayCount(count)

        const dueWords = await getDueWords()
        setDueCount(dueWords.length)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('daily_new_limit')
          .single()

        if (profileData?.daily_new_limit) {
          setDailyLimit(profileData.daily_new_limit)
        }
      } catch (err) {
        console.error('Failed to fetch words:', err)
        setError('Failed to load words. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchWords()
  }, [])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : words.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < words.length - 1 ? prev + 1 : 0))
  }

  const handleAddWord = async () => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      await addWord(currentWord.id)
      setWordStatuses((prev) => ({
        ...prev,
        [currentWord.id]: { status: 'learning', step: 0 },
      }))
      const newCount = todayCount + 1
      setTodayCount(newCount)
      handleNext()
    } catch (err) {
      console.error('Failed to add word:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkKnown = async () => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      await markKnown(currentWord.id)
      setWordStatuses((prev) => ({
        ...prev,
        [currentWord.id]: { status: 'known', step: 0 },
      }))
      handleNext()
    } catch (err) {
      console.error('Failed to mark word as known:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          </div>
          <WordSkeleton />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <p className="text-destructive text-sm">{error}</p>
        </div>
      </main>
    )
  }

  if (words.length === 0) {
    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <EmptyState
            icon={<BookOpen className="size-6" />}
            heading="No words yet"
            description="The word list is being built — check back soon."
          />
        </div>
      </main>
    )
  }

  const currentWord = words[currentIndex]
  const currentStatus = wordStatuses[currentWord?.id]

  return (
    <main className="min-h-screen p-4 pb-24 sm:p-8">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Dashboard
        </Link>

        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {todayCount} / {dailyLimit} words today
          </span>
        </div>

        {/* Daily progress bar */}
        <ProgressBar value={todayCount} max={dailyLimit} />

        {/* Quick-action row */}
        <div className="flex items-center gap-2">
          <Link href="/vocabulary/my-words">
            <Button variant="outline" size="sm">
              My Words
            </Button>
          </Link>
          {dueCount > 0 && (
            <Link href="/vocabulary/review">
              <Button size="sm">
                Review ({dueCount})
              </Button>
            </Link>
          )}
        </div>

        {/* Card */}
        <FlashCard
          word={currentWord}
          currentStatus={currentStatus}
          onAddWord={handleAddWord}
          onMarkKnown={handleMarkKnown}
          isActionLoading={actionLoading}
          isQuotaFull={todayCount >= dailyLimit}
          dailyGoal={dailyLimit}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground font-medium">
            {currentIndex + 1} of {words.length}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  )
}
