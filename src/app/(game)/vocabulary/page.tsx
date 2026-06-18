'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { FlashCard } from './FlashCard'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addWord,
  markKnown,
  getDailyNewLimit,
  getDueWords,
  getTodayAddedCount,
  getVocabularyWordsPage,
  getWordStatusesForWords,
} from './actions'
import type { Word } from '@/types'

const PAGE_SIZE = 100
const PREFETCH_THRESHOLD = 20

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
  const [totalCount, setTotalCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wordStatuses, setWordStatuses] = useState<WordStatusMap>({})
  const [todayCount, setTodayCount] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(10)
  const [actionLoading, setActionLoading] = useState(false)
  const [dueCount, setDueCount] = useState(0)
  const pageRequestsRef = useRef<Map<number, Promise<void>>>(new Map())

  const loadWordPage = useCallback((offset: number) => {
    const existingRequest = pageRequestsRef.current.get(offset)
    if (existingRequest) return existingRequest

    const request = (async () => {
      try {
        setLoadingMore(true)
        const page = await getVocabularyWordsPage(offset, PAGE_SIZE)
        const statuses = await getWordStatusesForWords(page.words.map((word) => word.id))

        setTotalCount(page.totalCount)
        setWordStatuses((prev) => ({ ...prev, ...statuses }))
        setWords((prev) => {
          if (offset === 0) return page.words

          const existingIds = new Set(prev.map((word) => word.id))
          const nextWords = page.words.filter((word) => !existingIds.has(word.id))
          return [...prev, ...nextWords]
        })
      } catch (err) {
        pageRequestsRef.current.delete(offset)
        throw err
      } finally {
        setLoadingMore(false)
      }
    })()

    pageRequestsRef.current.set(offset, request)
    return request
  }, [])

  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true)
        const wordPagePromise = loadWordPage(0)
        const metadataPromise = Promise.all([
          getTodayAddedCount(),
          getDueWords(),
          getDailyNewLimit(),
        ])
        const [, [count, dueWords, limit]] = await Promise.all([
          wordPagePromise,
          metadataPromise,
        ])

        setTodayCount(count)
        setDueCount(dueWords.length)
        setDailyLimit(limit)
      } catch (err) {
        console.error('Failed to fetch words:', err)
        setError('Failed to load words. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchWords()
  }, [loadWordPage])

  useEffect(() => {
    if (loading || loadingMore || words.length >= totalCount) return
    if (words.length - currentIndex > PREFETCH_THRESHOLD) return

    loadWordPage(words.length).catch((err) => {
      console.error('Failed to prefetch more words:', err)
    })
  }, [currentIndex, loadWordPage, loading, loadingMore, totalCount, words.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : words.length - 1))
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      return
    }

    if (words.length < totalCount) {
      loadWordPage(words.length)
        .then(() => setCurrentIndex((prev) => prev + 1))
        .catch((err) => {
          console.error('Failed to load more words:', err)
          setError('Failed to load more words. Please try again later.')
        })
      return
    }

    setCurrentIndex(0)
  }

  const removeCurrentWordFromQueue = () => {
    const wordId = currentWord.id
    const nextLength = Math.max(0, words.length - 1)

    setWords((prev) => prev.filter((word) => word.id !== wordId))
    setTotalCount((prev) => Math.max(0, prev - 1))
    setCurrentIndex((prev) => (nextLength === 0 ? 0 : Math.min(prev, nextLength - 1)))
  }

  const handleAddWord = async () => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      await addWord(currentWord.id)
      const newCount = todayCount + 1
      setTodayCount(newCount)
      removeCurrentWordFromQueue()
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
      removeCurrentWordFromQueue()
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
            heading="No new words left"
            description="You've already added or marked every available word."
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
            {currentIndex + 1} of {totalCount}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="gap-1.5"
            disabled={loadingMore && currentIndex >= words.length - 1}
          >
            {loadingMore && currentIndex >= words.length - 1 ? 'Loading' : 'Next'}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  )
}
