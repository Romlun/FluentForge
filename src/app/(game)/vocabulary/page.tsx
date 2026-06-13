'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlashCard } from './FlashCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addWord, markKnown, getTodayAddedCount, getWordStatuses, getDueWords } from './actions'
import type { Word } from '@/types'

interface WordStatusMap {
  [wordId: number]: { status: 'learning' | 'known'; step: number }
}

function WordSkeleton() {
  return (
    <div className="h-96 w-full">
      <Card className="w-full h-full animate-pulse bg-muted" />
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
  const [isFlipped, setIsFlipped] = useState(false)
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
    setIsFlipped(false)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < words.length - 1 ? prev + 1 : 0))
    setIsFlipped(false)
  }

  const handleAddWord = async () => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const progress = await addWord(currentWord.id)
      setWordStatuses((prev) => ({
        ...prev,
        [currentWord.id]: { status: 'learning', step: 0 },
      }))
      const newCount = todayCount + 1
      setTodayCount(newCount)
      
      if (newCount < dailyLimit) {
        handleNext()
        setIsFlipped(false)
      }
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
      setIsFlipped(false)
    } catch (err) {
      console.error('Failed to mark word as known:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Vocabulary</h1>
          <WordSkeleton />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Vocabulary</h1>
          <Card className="p-8 text-center">
            <p className="text-destructive">{error}</p>
          </Card>
        </div>
      </main>
    )
  }

  if (words.length === 0) {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Vocabulary</h1>
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">
              No words yet — check back soon!
            </p>
          </Card>
        </div>
      </main>
    )
  }

  const currentWord = words[currentIndex]
  const currentStatus = wordStatuses[currentWord?.id]

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Vocabulary</h1>
          <div className="flex items-center gap-4">
            {dueCount > 0 && (
              <Link href="/vocabulary/review">
                <Button variant="default" size="sm">
                  Review ({dueCount})
                </Button>
              </Link>
            )}
            <div className="text-sm text-muted-foreground">
              {todayCount} / {dailyLimit} new words added today
            </div>
          </div>
        </div>

        <FlashCard 
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={setIsFlipped}
          currentStatus={currentStatus}
          onAddWord={handleAddWord}
          onMarkKnown={handleMarkKnown}
          isActionLoading={actionLoading}
          isQuotaFull={todayCount >= dailyLimit}
        />

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <p className="text-sm text-muted-foreground font-medium">
            {currentIndex + 1} / {words.length}
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </main>
  )
}
