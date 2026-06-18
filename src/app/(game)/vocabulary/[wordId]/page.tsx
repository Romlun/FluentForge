'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Volume2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { isBrowserTtsAvailable, speakAmerican } from '@/lib/tts'
import { cn } from '@/lib/utils'
import {
  getWordById,
  getUserWordProgress,
  removeFromMyWords,
  type UserWordWithWord,
  type UserWordProgress,
} from '../actions'

export default function WordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const wordId = Number(params.wordId)

  const [word, setWord] = useState<UserWordWithWord['word'] | null>(null)
  const [progress, setProgress] = useState<UserWordProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)
  const [canUseBrowserTts, setCanUseBrowserTts] = useState(false)

  useEffect(() => {
    if (!wordId) return
    Promise.all([getWordById(wordId), getUserWordProgress(wordId)])
      .then(([w, p]) => {
        setWord(w)
        setProgress(p)
      })
      .finally(() => setLoading(false))
  }, [wordId])

  useEffect(() => {
    setCanUseBrowserTts(isBrowserTtsAvailable())
  }, [])

  const handlePlay = () => {
    if (word?.audio_url) {
      new Audio(word.audio_url).play().catch(() => {})
      return
    }

    if (word) {
      speakAmerican(word.word)
    }
  }

  const handleRemove = async () => {
    if (removing) return
    try {
      setRemoving(true)
      await removeFromMyWords(wordId)
      router.push('/vocabulary/my-words')
    } catch {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5 animate-pulse">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="h-10 w-48 mx-auto rounded bg-muted" />
            <div className="h-4 w-28 mx-auto rounded bg-muted" />
            <div className="border-t pt-4 space-y-2">
              <div className="h-6 w-36 mx-auto rounded bg-muted" />
              <div className="h-4 w-56 mx-auto rounded bg-muted" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!word) {
    return (
      <main className="min-h-screen p-4 pb-24 sm:p-8">
        <div className="max-w-lg mx-auto space-y-5">
          <Link
            href="/vocabulary/my-words"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            My Words
          </Link>
          <EmptyState
            icon={<BookOpen className="size-6" />}
            heading="Word not found"
            description="This word doesn't exist or was removed."
            action={
              <Link href="/vocabulary">
                <Button variant="outline" size="sm">Browse Vocabulary</Button>
              </Link>
            }
          />
        </div>
      </main>
    )
  }

  const statusVariant = progress
    ? progress.lapses >= 2
      ? ('difficult' as const)
      : progress.status
    : null
  const canPlayPronunciation = Boolean(word.audio_url) || canUseBrowserTts

  return (
    <main className="min-h-screen p-4 pb-24 sm:p-8">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Back link */}
        <Link
          href="/vocabulary/my-words"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          My Words
        </Link>

        {/* Word card */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Word, phonetic, PoS, audio */}
          <div className="px-6 pt-6 pb-4 text-center space-y-1.5">
            <h1 className="font-display text-4xl font-bold tracking-tight">{word.word}</h1>
            {word.phonetic && (
              <p className="text-sm text-muted-foreground">{word.phonetic}</p>
            )}
            <div className="flex items-center justify-center gap-2 pt-1">
              {word.part_of_speech && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {word.part_of_speech}
                </span>
              )}
              <button
                type="button"
                onClick={handlePlay}
                disabled={!canPlayPronunciation}
                className={cn(
                  'flex items-center justify-center size-7 rounded-full transition-colors',
                  canPlayPronunciation
                    ? 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    : 'text-muted-foreground/40 cursor-default'
                )}
                aria-label={canPlayPronunciation ? 'Play pronunciation' : 'Audio unavailable'}
              >
                <Volume2 className="size-4" />
              </button>
            </div>
            {statusVariant && (
              <div className="flex justify-center pt-1">
                <StatusBadge variant={statusVariant} />
              </div>
            )}
          </div>

          <div className="mx-6 border-t" />

          {/* Translation, definition */}
          <div className="px-6 py-4 space-y-2">
            {word.translation && word.translation.trim() && (
              <p className="text-xl font-bold text-center">{word.translation}</p>
            )}
            <p className="text-sm text-muted-foreground text-center">{word.definition}</p>
          </div>

          {/* Example sentence */}
          {word.example_sentence && (
            <>
              <div className="mx-6 border-t" />
              <div className="px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Example
                </p>
                <p className="text-sm italic text-muted-foreground">
                  &ldquo;{word.example_sentence}&rdquo;
                </p>
              </div>
            </>
          )}
        </div>

        {/* SRS stats — only if word is in user's list */}
        {progress && (
          <div className="rounded-2xl border bg-card px-6 py-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{progress.reps}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.lapses}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Lapses</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.step}</p>
              <p className="text-xs text-muted-foreground mt-0.5">SRS step</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/vocabulary/review">
            <Button className="w-full">Practice this word</Button>
          </Link>
          {progress && (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? 'Removing…' : 'Remove from my words'}
            </Button>
          )}
          {!progress && (
            <p className="text-center text-sm text-muted-foreground">
              This word isn&apos;t in your list — add it from the{' '}
              <Link href="/vocabulary" className="underline underline-offset-2">
                vocabulary browser
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
