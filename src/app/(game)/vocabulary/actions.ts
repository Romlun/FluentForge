'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfTodayInTimeZone } from '@/lib/date'
import type { Word } from '@/types'

const SRS_LADDER: Record<number, number> = {
  0: 0,
  1: 60,
  2: 120,
  3: 240,
  4: 480,
  5: 1440,
  6: 2880,
  7: 5760,
  8: 11520,
  9: 23040,
  10: 43200,
}

export interface UserWordProgress {
  id: number
  user_id: string
  word_id: number
  status: 'learning' | 'known'
  step: number
  next_review_at: string
  reps: number
  lapses: number
  created_at: string
}

export interface WordWithProgress {
  progress: UserWordProgress
  word: {
    id: number
    word: string
    translation: string | null
    definition: string
    part_of_speech: string | null
    phonetic: string | null
    audio_url: string | null
  }
}

export type ReviewOutcome = 'remember' | 'need_practice' | 'forgot'

export interface VocabularyWordsPage {
  words: Word[]
  totalCount: number
}

export async function addWord(wordId: number): Promise<UserWordProgress> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .single()

  if (existing) {
    return existing as UserWordProgress
  }

  const { data, error } = await supabase
    .from('user_word_progress')
    .insert({
      user_id: user.id,
      word_id: wordId,
      status: 'learning',
      step: 0,
      next_review_at: new Date().toISOString(),
      reps: 0,
      lapses: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as UserWordProgress
}

export async function markKnown(wordId: number): Promise<UserWordProgress> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_word_progress')
    .upsert(
      {
        user_id: user.id,
        word_id: wordId,
        status: 'known',
      },
      { onConflict: 'user_id,word_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as UserWordProgress
}

export async function rateWord(
  wordId: number,
  outcome: ReviewOutcome
): Promise<UserWordProgress> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data: current, error: fetchError } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .single()

  if (fetchError) throw fetchError

  const progress = current as UserWordProgress
  let newStep: number
  let newReps = progress.reps
  let newLapses = progress.lapses

  // Review outcome to SRS_LADDER step mapping. Adjust here when tuning the ladder.
  if (outcome === 'remember') {
    newStep = Math.min(10, progress.step + 1)
  } else if (outcome === 'need_practice') {
    // Reinforcement, not a lapse.
    newStep = Math.max(0, progress.step - 1)
  } else {
    newStep = Math.max(0, progress.step - 3)
    newLapses += 1
  }
  newReps += 1

  const minutesUntilNextReview = SRS_LADDER[newStep]
  const nextReviewAt = new Date(Date.now() + minutesUntilNextReview * 60 * 1000)

  const { data, error: updateError } = await supabase
    .from('user_word_progress')
    .update({
      step: newStep,
      next_review_at: nextReviewAt.toISOString(),
      reps: newReps,
      lapses: newLapses,
    })
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .select()
    .single()

  if (updateError) throw updateError
  return data as UserWordProgress
}

function shuffleOptions(options: string[]) {
  const shuffled = [...options]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function getReviewOptions(
  wordId: number,
  correctTranslation: string
): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const normalizedCorrect = correctTranslation.trim()

  // One random query is enough at this table size; overfetch guards against duplicate translations.
  const { data, error } = await supabase.rpc('get_random_distractor_translations', {
    exclude_word_id: wordId,
    exclude_translation: normalizedCorrect,
  })

  if (error) throw error

  const distractors: string[] = []
  const seen = new Set([normalizedCorrect])

  for (const row of data || []) {
    const translation = row.translation?.trim()
    if (!translation || seen.has(translation)) continue
    seen.add(translation)
    distractors.push(translation)
    if (distractors.length === 3) break
  }

  return shuffleOptions([normalizedCorrect, ...distractors])
}

export async function getDueWords(): Promise<WordWithProgress[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_word_progress')
    .select(`
      id,
      user_id,
      word_id,
      status,
      step,
      next_review_at,
      reps,
      lapses,
      created_at,
      word:words(id, word, translation, definition, part_of_speech, phonetic, audio_url)
    `)
    .eq('user_id', user.id)
    .eq('status', 'learning')
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })

  if (error) throw error

  return (data || []).map((row) => ({
    progress: {
      id: row.id,
      user_id: row.user_id,
      word_id: row.word_id,
      status: row.status,
      step: row.step,
      next_review_at: row.next_review_at,
      reps: row.reps,
      lapses: row.lapses,
      created_at: row.created_at,
    },
    word: (Array.isArray(row.word) ? row.word[0] : row.word) as WordWithProgress["word"],
  })) as unknown as WordWithProgress[]
}

export async function getWordStatuses(): Promise<
  Record<number, { status: 'learning' | 'known'; step: number }>
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_word_progress')
    .select('word_id, status, step')
    .eq('user_id', user.id)

  if (error) throw error

  const map: Record<number, { status: 'learning' | 'known'; step: number }> = {}
  for (const row of data || []) {
    map[row.word_id] = {
      status: row.status,
      step: row.step,
    }
  }
  return map
}

export async function getWordStatusesForWords(
  wordIds: number[]
): Promise<Record<number, { status: 'learning' | 'known'; step: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (wordIds.length === 0) return {}

  const { data, error } = await supabase
    .from('user_word_progress')
    .select('word_id, status, step')
    .eq('user_id', user.id)
    .in('word_id', wordIds)

  if (error) throw error

  const map: Record<number, { status: 'learning' | 'known'; step: number }> = {}
  for (const row of data || []) {
    map[row.word_id] = {
      status: row.status,
      step: row.step,
    }
  }
  return map
}

export async function getVocabularyWordsPage(
  offset: number,
  limit: number
): Promise<VocabularyWordsPage> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const from = Math.max(0, offset)
  const pageSize = Math.max(1, limit)

  const { data, count, error } = await supabase
    .from('words')
    .select(
      'id, word, translation, definition, part_of_speech, frequency_rank, example_sentence, image_url, audio_url, phonetic, tags, created_at, user_word_progress!left(word_id)',
      { count: 'exact' }
    )
    .is('user_word_progress.word_id', null)
    .order('frequency_rank', { ascending: true })
    .range(from, from + pageSize - 1)

  if (error) throw error

  return {
    words: (data || []) as Word[],
    totalCount: count || 0,
  }
}

export async function getDailyNewLimit(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('daily_new_limit')
    .single()

  if (error) return 10
  return data?.daily_new_limit || 10
}

export async function getTodayAddedCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const today = startOfTodayInTimeZone()

  const { count, error } = await supabase
    .from('user_word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  if (error) throw error
  return count || 0
}

export interface UserWordWithWord {
  progress: UserWordProgress
  word: {
    id: number
    word: string
    translation: string | null
    definition: string
    part_of_speech: string | null
    phonetic: string | null
    example_sentence: string | null
    audio_url: string | null
    frequency_rank: number | null
    tags: string[]
    created_at: string
  }
}

export type WordFilter = 'all' | 'learning' | 'known' | 'difficult' | 'due_today'

// "Difficult" = lapses >= 2. Adjust threshold here if needed.
const DIFFICULT_LAPSE_THRESHOLD = 2

export async function getUserWords(
  filter: WordFilter = 'all',
  search = ''
): Promise<UserWordWithWord[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('user_word_progress')
    .select(`
      id,
      user_id,
      word_id,
      status,
      step,
      next_review_at,
      reps,
      lapses,
      created_at,
      word:words(
        id, word, translation, definition,
        part_of_speech, phonetic, example_sentence,
        audio_url, frequency_rank, tags, created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (filter === 'learning') query = query.eq('status', 'learning')
  else if (filter === 'known') query = query.eq('status', 'known')
  else if (filter === 'difficult') query = query.gte('lapses', DIFFICULT_LAPSE_THRESHOLD)
  else if (filter === 'due_today') query = query.lte('next_review_at', new Date().toISOString())

  const { data, error } = await query

  if (error) throw error

  let rows = (data || []).map((row) => ({
    progress: {
      id: row.id,
      user_id: row.user_id,
      word_id: row.word_id,
      status: row.status as 'learning' | 'known',
      step: row.step,
      next_review_at: row.next_review_at,
      reps: row.reps,
      lapses: row.lapses,
      created_at: row.created_at,
    },
    word: (Array.isArray(row.word) ? row.word[0] : row.word) as UserWordWithWord['word'],
  }))

  if (search.trim()) {
    const q = search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.word.word.toLowerCase().includes(q) ||
        (r.word.translation ?? '').toLowerCase().includes(q)
    )
  }

  return rows
}

export async function getWordById(wordId: number): Promise<UserWordWithWord['word'] | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('words')
    .select('id, word, translation, definition, part_of_speech, phonetic, example_sentence, audio_url, frequency_rank, tags, created_at')
    .eq('id', wordId)
    .single()

  if (error) return null
  return data as UserWordWithWord['word']
}

export async function getUserWordProgress(wordId: number): Promise<UserWordProgress | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .single()

  if (error) return null
  return data as UserWordProgress
}

export async function removeFromMyWords(wordId: number): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('user_word_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('word_id', wordId)

  if (error) throw error
}
