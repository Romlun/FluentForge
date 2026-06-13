import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

interface WordData {
  word: string
  part_of_speech: string
  phonetic: string
  translation: string
  definition: string
  example_sentence: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY

if (!supabaseUrl || !serviceRoleKey || !anthropicKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY'
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey)
const anthropic = new Anthropic({ apiKey: anthropicKey })

const BATCH_SIZE = 10
const TOTAL_WORDS = 5000
const SLEEP_MS = 1000
const RETRY_SLEEP_MS = 2000

async function fetchWordList(): Promise<string[]> {
  console.log('📥 Fetching word list from GitHub...')
  const response = await fetch(
    'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt'
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch word list: ${response.statusText}`)
  }
  const text = await response.text()
  const words = text
    .split('\n')
    .filter(w => w.trim())
    .slice(0, TOTAL_WORDS)
    .filter(w => w.length >= 1)

  console.log(`✅ Fetched ${words.length} words`)
  return words
}

async function getExistingWords(): Promise<Set<string>> {
  console.log('🔍 Querying existing words...')
  const { data, error } = await supabase.from('words').select('word')

  if (error) {
    console.warn('⚠️  Could not query existing words:', error.message)
    return new Set()
  }

  const existing = new Set(data.map((row: { word: string }) => row.word.toLowerCase()))
  console.log(`✅ Found ${existing.size} existing words`)
  return existing
}

async function generateContentForBatch(words: string[]): Promise<WordData[]> {
  const systemPrompt =
    'You generate English learning content for Russian speakers. Return ONLY a valid JSON array. No markdown, no explanation, no code fences.'

  const userPrompt = `Generate language learning content for these English words. Return a JSON array where each element has exactly these keys: word (string), part_of_speech (one of: noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection), phonetic (IPA transcription), translation (Russian Cyrillic, primary meaning), definition (English, max 15 words), example_sentence (natural English sentence). Words: ${JSON.stringify(words)}`

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response format from Claude')
  }

  try {
    const data = JSON.parse(content.text)
    if (!Array.isArray(data)) {
      throw new Error('Response is not an array')
    }
    return data
  } catch (e) {
    console.error('Failed to parse Claude response:', content.text)
    throw new Error('Invalid JSON response from Claude')
  }
}

async function upsertWords(words: WordData[], frequencyRanks: Map<string, number>): Promise<void> {
  const records = words.map(w => ({
    word: w.word,
    part_of_speech: w.part_of_speech,
    phonetic: w.phonetic,
    translation: w.translation,
    definition: w.definition,
    example_sentence: w.example_sentence,
    frequency_rank: frequencyRanks.get(w.word.toLowerCase()) || 0,
  }))

  const { error } = await supabase.from('words').upsert(records, {
    onConflict: 'word',
  })

  if (error) {
    throw error
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processBatch(
  batch: string[],
  batchIndex: number,
  totalBatches: number,
  frequencyRanks: Map<string, number>
): Promise<boolean> {
  try {
    console.log(`\n⏳ Processing batch ${batchIndex}/${totalBatches} (${batch.length} words)...`)
    const wordData = await generateContentForBatch(batch)
    await upsertWords(wordData, frequencyRanks)
    const totalProcessed = Math.min(batchIndex * BATCH_SIZE, TOTAL_WORDS)
    console.log(`✅ Processed ${totalProcessed}/${TOTAL_WORDS} words...`)
    return true
  } catch (error) {
    console.error(`❌ Error in batch ${batchIndex}:`, error)
    console.log(`⏸️  Waiting ${RETRY_SLEEP_MS}ms before retry...`)
    await sleep(RETRY_SLEEP_MS)

    try {
      console.log(`🔄 Retrying batch ${batchIndex}...`)
      const wordData = await generateContentForBatch(batch)
      await upsertWords(wordData, frequencyRanks)
      const totalProcessed = Math.min(batchIndex * BATCH_SIZE, TOTAL_WORDS)
      console.log(`✅ Processed ${totalProcessed}/${TOTAL_WORDS} words...`)
      return true
    } catch (retryError) {
      console.error(`⏭️  SKIPPED batch ${batchIndex} after retry:`, retryError)
      return false
    }
  }
}

async function seed(): Promise<void> {
  const startTime = Date.now()

  try {
    const words = await fetchWordList()
    const existing = await getExistingWords()

    const frequencyRanks = new Map<string, number>()
    const toProcess: string[] = []

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase()
      frequencyRanks.set(word, i + 1)

      if (!existing.has(word)) {
        toProcess.push(word)
      }
    }

    if (toProcess.length === 0) {
      console.log('✅ All words already exist in database')
      process.exit(0)
      return
    }

    console.log(`\n📚 Need to process ${toProcess.length} new words`)

    const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE)
    let skippedBatches = 0

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1
      const batch = toProcess.slice(i, i + BATCH_SIZE)

      const success = await processBatch(batch, batchIndex, totalBatches, frequencyRanks)
      if (!success) {
        skippedBatches++
      }

      if (i + BATCH_SIZE < toProcess.length) {
        console.log(`⏸️  Sleeping ${SLEEP_MS}ms...`)
        await sleep(SLEEP_MS)
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n✨ Seeding complete!`)
    console.log(`   Total time: ${elapsed}s`)
    console.log(`   Processed: ${toProcess.length} words`)
    console.log(`   Skipped batches: ${skippedBatches}/${totalBatches}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

seed()
