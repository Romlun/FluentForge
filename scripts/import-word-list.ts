import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

interface WordEntry {
  position: number
  word: string
}

async function fetchAndParsePdf(): Promise<string> {
  console.log('📥 Fetching PDF from Britlex...')
  const response = await fetch('https://britlex.ru/5000_7000_English_words.pdf')
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  const pdf = await pdfParse(buffer)
  console.log('✅ PDF fetched and parsed')
  return pdf.text
}

function extractEntries(text: string): WordEntry[] {
  const lines = text.split('\n')
  const entries: WordEntry[] = []
  const regex = /^(\d+)\s+([a-zA-Z][a-zA-Z\s\(\),]*?)\s+\[/

  for (const line of lines) {
    const match = line.match(regex)
    if (match) {
      const position = parseInt(match[1], 10)
      const word = match[2].trim()
      entries.push({ position, word })
    }
  }

  console.log(`✅ Extracted ${entries.length} word entries`)
  return entries
}

async function upsertWords(entries: WordEntry[]): Promise<void> {
  console.log(`📝 Upserting ${entries.length} words into word_list table...`)

  const records = entries.map(entry => ({
    position: entry.position,
    word: entry.word,
    source: 'britlex_5000',
    category: 'vocabulary',
  }))

  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100)
    const { error } = await supabase
      .from('word_list')
      .upsert(batch, { onConflict: 'position' })

    if (error) {
      throw error
    }

    const progress = Math.min(i + 100, records.length)
    console.log(`✅ Processed ${progress}/${records.length} words`)
  }
}

async function verifyImport(): Promise<void> {
  console.log('🔍 Verifying import...')
  const { data, error } = await supabase
    .from('word_list')
    .select('count', { count: 'exact' })

  if (error) {
    throw error
  }

  console.log(`✨ Total words in word_list: ${data?.[0]?.count || 0}`)
}

async function main(): Promise<void> {
  const startTime = Date.now()

  try {
    const pdfText = await fetchAndParsePdf()
    const entries = extractEntries(pdfText)
    await upsertWords(entries)
    await verifyImport()

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n✨ Import complete! (${elapsed}s)`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
