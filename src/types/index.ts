// FluentForge — shared TypeScript types
// Domain types added here as features are built

export interface Word {
  id: number
  word: string
  definition: string
  part_of_speech: string | null
  frequency_rank: number | null
  example_sentence: string | null
  image_url: string | null
  audio_url: string | null
  phonetic: string | null
  tags: string[]
  created_at: string
  translation?: string | null
}
