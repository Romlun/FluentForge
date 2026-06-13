'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Volume2 } from 'lucide-react'
import type { Word } from '@/types'

interface FlashCardProps {
  word: Word
}

export function FlashCard({ word }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="h-96 w-full cursor-pointer perspective"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-full transition-transform duration-300"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Card className="w-full h-full flex flex-col items-center justify-center p-8 gap-4">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold">{word.word}</h2>
              {word.phonetic && (
                <p className="text-sm text-muted-foreground">{word.phonetic}</p>
              )}
            </div>
            {word.part_of_speech && (
              <Badge variant="secondary">{word.part_of_speech}</Badge>
            )}
          </Card>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <Card className="w-full h-full flex flex-col p-8 gap-4 overflow-y-auto">
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-2xl font-semibold">{word.definition}</p>
              </div>
              {word.example_sentence && (
                <div>
                  <p className="text-muted-foreground italic">
                    {word.example_sentence}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t">
              {word.audio_url ? (
                <a href={word.audio_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Listen
                  </Button>
                </a>
              ) : (
                <Button variant="outline" size="sm" disabled className="w-full">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Audio unavailable
                </Button>
              )}

              {word.image_url ? (
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={word.image_url}
                    alt={word.word}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No image available</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
