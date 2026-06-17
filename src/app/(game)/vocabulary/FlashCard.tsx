'use client'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Bookmark, Volume2 } from 'lucide-react'
import type { Word } from '@/types'
import { cn } from '@/lib/utils'

interface FlashCardProps {
  word: Word
  currentStatus?: { status: 'learning' | 'known'; step: number }
  onAddWord?: () => Promise<void>
  onMarkKnown?: () => Promise<void>
  isActionLoading?: boolean
  isQuotaFull?: boolean
  dailyGoal?: number
}

export function FlashCard({
  word,
  currentStatus,
  onAddWord,
  onMarkKnown,
  isActionLoading = false,
  isQuotaFull = false,
  dailyGoal,
}: FlashCardProps) {
  const handlePlay = () => {
    if (word.audio_url) {
      new Audio(word.audio_url).play().catch(() => {})
    }
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden relative">
      {/* Bookmark — visual only, no bookmark concept in DB yet */}
      <button
        type="button"
        className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Bookmark"
        tabIndex={-1}
      >
        <Bookmark className="size-5" />
      </button>

      {/* Word, phonetic, PoS, audio */}
      <div className="px-6 pt-6 pb-4 text-center space-y-1.5">
        <h2 className="font-display text-4xl font-bold tracking-tight">{word.word}</h2>
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
            disabled={!word.audio_url}
            className={cn(
              'flex items-center justify-center size-7 rounded-full transition-colors',
              word.audio_url
                ? 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                : 'text-muted-foreground/40 cursor-default'
            )}
            aria-label={word.audio_url ? 'Play pronunciation' : 'Audio unavailable'}
          >
            <Volume2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mx-6 border-t" />

      {/* Translation, definition, example */}
      <div className="px-6 py-4 text-center space-y-2">
        {word.translation && word.translation.trim() && (
          <p className="text-xl font-bold">{word.translation}</p>
        )}
        <p className="text-sm text-muted-foreground">{word.definition}</p>
        {word.example_sentence && (
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{word.example_sentence}&rdquo;
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-6 pt-2">
        {!currentStatus ? (
          <div className="flex gap-3">
            <Button
              variant={isQuotaFull ? 'secondary' : 'default'}
              className="flex-1 h-auto min-h-8 whitespace-normal py-2"
              onClick={onAddWord}
              disabled={isActionLoading}
            >
              <span className="flex flex-col leading-tight">
                <span>{isQuotaFull ? 'Add anyway' : 'Add to learn'}</span>
                {isQuotaFull && dailyGoal !== undefined && (
                  <span className="text-[10px] font-normal opacity-80">
                    Today&apos;s goal: {dailyGoal}
                  </span>
                )}
              </span>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onMarkKnown}
              disabled={isActionLoading}
            >
              I know this
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <StatusBadge variant={currentStatus.status} />
          </div>
        )}
      </div>
    </div>
  )
}
