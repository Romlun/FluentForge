'use server'

import { createClient } from '@/lib/supabase/server'

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
  }
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
  outcome: 'got_it' | 'again'
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

  if (outcome === 'got_it') {
    newStep = Math.min(10, progress.step + 1)
    newReps += 1
  } else {
    newStep = Math.max(1, progress.step - 1)
    newLapses += 1
  }

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
      word:words(id, word, translation, definition)
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
    word: row.word,
  })) as WordWithProgress[]
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

export async function getTodayAddedCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('user_word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  if (error) throw error
  return count || 0
}
