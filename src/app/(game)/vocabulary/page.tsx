'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FlashCard } from './FlashCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Word } from '@/types'

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

  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('words')
          .select('*')
          .order('frequency_rank', { ascending: true })

        if (fetchError) throw fetchError

        setWords(data || [])
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

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Vocabulary</h1>
          <WordSkeleton />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
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
      <main className="min-h-screen p-8">
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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Vocabulary</h1>

        <FlashCard word={currentWord} />

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
