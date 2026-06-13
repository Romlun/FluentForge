import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const words = [
  {
    word: 'abundant',
    definition: 'present in large quantities',
    part_of_speech: 'adjective',
    frequency_rank: 1,
    example_sentence: 'The region has abundant natural resources.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'acknowledge',
    definition: 'to accept or admit the truth of',
    part_of_speech: 'verb',
    frequency_rank: 2,
    example_sentence: 'She acknowledged that she had made a mistake.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'brief',
    definition: 'short in duration',
    part_of_speech: 'adjective',
    frequency_rank: 3,
    example_sentence: 'The meeting was brief but productive.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'capable',
    definition: 'having the ability to do something',
    part_of_speech: 'adjective',
    frequency_rank: 4,
    example_sentence: 'He is capable of great kindness.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'despite',
    definition: 'without being affected by',
    part_of_speech: 'preposition',
    frequency_rank: 5,
    example_sentence: 'She succeeded despite the obstacles.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'ensure',
    definition: 'to make certain that something happens',
    part_of_speech: 'verb',
    frequency_rank: 6,
    example_sentence: 'Please ensure the door is locked.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'frequent',
    definition: 'occurring often',
    part_of_speech: 'adjective',
    frequency_rank: 7,
    example_sentence: 'He makes frequent trips to the library.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'gather',
    definition: 'to come together in a group',
    part_of_speech: 'verb',
    frequency_rank: 8,
    example_sentence: 'People gathered in the square to celebrate.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'harsh',
    definition: 'unpleasantly rough or severe',
    part_of_speech: 'adjective',
    frequency_rank: 9,
    example_sentence: 'The harsh winter made travel difficult.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
  {
    word: 'impact',
    definition: 'a strong effect or influence',
    part_of_speech: 'noun',
    frequency_rank: 10,
    example_sentence: 'The new policy had a significant impact on sales.',
    image_url: null,
    audio_url: null,
    phonetic: null,
    tags: [],
  },
]

async function seed() {
  try {
    const { data, error } = await supabase.from('words').insert(words)

    if (error) {
      throw error
    }

    console.log(`✅ Seeded ${words.length} words successfully`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
