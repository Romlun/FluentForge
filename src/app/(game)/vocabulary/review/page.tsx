'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDueWords, rateWord } from '../actions'
import type { WordWithProgress } from '../actions'

interface ReviewState {
  queue: WordWithProgress[]
  currentIndex: number
  isFlipped: boolean
}

export default function ReviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<ReviewState>({
    queue: [],
    currentIndex: 0,
    isFlipped: false,
  })
  const [isRating, setIsRating] = useState(false)
  const [nextDueTime, setNextDueTime] = useState<Date | null>(null)

  useEffect(() => {
    const fetchDueWords = async () => {
      try {
        setLoading(true)
        const words = await getDueWords()
        setState({
          queue: words,
          currentIndex: 0,
          isFlipped: false,
        })

        if (words.length === 0) {
          const allDueQuery = await fetch('/api/next-due-word')
          if (allDueQuery.ok) {
            const data = await allDueQuery.json()
            if (data.nextDueAt) {
              setNextDueTime(new Date(data.nextDueAt))
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch due words:', err)
        setError('Failed to load review session. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchDueWords()
  }, [])

  const handleRate = async (outcome: 'got_it' | 'again') => {
    if (isRating || state.queue.length === 0) return

    try {
      setIsRating(true)
      const currentItem = state.queue[state.currentIndex]
      await rateWord(currentItem.progress.word_id, outcome)

      if (outcome === 'again') {
        const movedItem = state.queue[state.currentIndex]
        const newQueue = [
          ...state.queue.slice(0, state.currentIndex),
          ...state.queue.slice(state.currentIndex + 1),
          movedItem,
        ]
        setState({
          queue: newQueue,
          currentIndex: Math.max(0, state.currentIndex - 1),
          isFlipped: false,
        })
      } else {
        if (state.currentIndex < state.queue.length - 1) {
          setState((prev) => ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
            isFlipped: false,
          }))
        } else {
          const newQueue = state.queue.slice(0, state.currentIndex)
          setState({
            queue: newQueue,
            currentIndex: 0,
            isFlipped: false,
          })
        }
      }
    } catch (err) {
      console.error('Failed to rate word:', err)
    } finally {
      setIsRating(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Review</h1>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading review session...</p>
          </Card>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Review</h1>
          <Card className="p-8 text-center">
            <p className="text-destructive">{error}</p>
          </Card>
        </div>
      </main>
    )
  }

  if (state.queue.length === 0) {
    const formatTimeUntilDue = (date: Date): string => {
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

    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Review</h1>
          <Card className="p-12 text-center space-y-4">
            <p className="text-2xl font-bold">Nothing due right now 🎉</p>
            <p className="text-muted-foreground">
              {nextDueTime
                ? `Next word available in ${formatTimeUntilDue(nextDueTime)}`
                : "Check back later for words to review!"}
            </p>
            <div>
              <Link href="/vocabulary">
                <Button variant="outline">Back to vocabulary</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  const currentItem = state.queue[state.currentIndex]
  const remaining = state.queue.length - state.currentIndex

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review</h1>
          <p className="text-sm text-muted-foreground">
            {remaining} remaining
          </p>
        </div>

        <div
          className="h-96 w-full cursor-pointer perspective"
          onClick={() => setState((prev) => ({ ...prev, isFlipped: !prev.isFlipped }))}
        >
          <div
            className="relative w-full h-full transition-transform duration-300"
            style={{
              transformStyle: 'preserve-3d',
              transform: state.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute w-full h-full"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Card className="w-full h-full flex flex-col items-center justify-center p-8">
                <div className="text-center">
                  <h2 className="text-4xl font-bold">{currentItem.word.word}</h2>
                </div>
              </Card>
            </div>

            {/* Back */}
            <div
              className="absolute w-full h-full"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <Card className="w-full h-full flex flex-col p-8 justify-center items-center gap-4">
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold">
                    {currentItem.word.translation || currentItem.word.definition}
                  </p>
                  {currentItem.word.translation && (
                    <p className="text-base text-muted-foreground">
                      {currentItem.word.definition}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {state.isFlipped && (
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleRate('again')}
              disabled={isRating}
            >
              Again
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={() => handleRate('got_it')}
              disabled={isRating}
            >
              Got it
            </Button>
          </div>
        )}

        {!state.isFlipped && (
          <div className="text-center text-sm text-muted-foreground">
            Tap card to flip
          </div>
        )}
      </div>
    </main>
  )
}
