'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, Bookmark } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { getUserWords, type UserWordWithWord, type WordFilter } from '../actions'
import { cn } from '@/lib/utils'

const FILTERS: { label: string; value: WordFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Learning', value: 'learning' },
  { label: 'Known', value: 'known' },
  { label: 'Difficult', value: 'difficult' },
  { label: 'Due today', value: 'due_today' },
]

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-0 animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-3 w-36 rounded bg-muted" />
      </div>
      <div className="h-5 w-16 rounded-full bg-muted" />
    </div>
  )
}

export default function MyWordsPage() {
  const [filter, setFilter] = useState<WordFilter>('all')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<UserWordWithWord[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const fetchWords = (f: WordFilter, q: string) => {
    setLoading(true)
    startTransition(async () => {
      try {
        const data = await getUserWords(f, q)
        setRows(data)
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    })
  }

  useEffect(() => {
    fetchWords(filter, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (f: WordFilter) => {
    setFilter(f)
    fetchWords(f, search)
  }

  const handleSearch = (q: string) => {
    setSearch(q)
    fetchWords(filter, q)
  }

  const statusVariant = (row: UserWordWithWord) => {
    if (row.progress.lapses >= 2) return 'difficult' as const
    return row.progress.status
  }

  return (
    <main className="min-h-screen p-4 pb-24 sm:p-8">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Back link */}
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Vocabulary
        </Link>

        <h1 className="text-2xl font-bold">My Words</h1>

        {/* Search */}
        <SearchInput
          placeholder="Search words or translations…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                filter === f.value
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Word list */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          {loading || isPending ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : rows.length === 0 ? (
            <EmptyState
              heading={search ? 'No matches' : 'Nothing here yet'}
              description={
                search
                  ? 'Try a different search term.'
                  : filter === 'all'
                  ? 'Add words from the Vocabulary browser to get started.'
                  : `No ${filter.replace('_', ' ')} words.`
              }
              className="py-16"
            />
          ) : (
            rows.map((row) => (
              <Link
                key={row.progress.word_id}
                href={`/vocabulary/${row.progress.word_id}`}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
              >
                {/* Word info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{row.word.word}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.word.part_of_speech && (
                      <span className="capitalize">{row.word.part_of_speech} · </span>
                    )}
                    {row.word.translation ?? row.word.definition}
                  </p>
                </div>

                {/* Status badge */}
                <StatusBadge variant={statusVariant(row)} />

                {/* Bookmark icon — visual only */}
                <Bookmark className="size-4 shrink-0 text-muted-foreground/50" />
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
