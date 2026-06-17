import Link from 'next/link'
import { Bell, BookOpen, Menu, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { startOfTodayInTimeZone } from '@/lib/date'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import type { WordStatusVariant } from '@/components/ui/status-badge'

// ─── helpers ─────────────────────────────────────────────────────────────────

function toStatusVariant(dbStatus: string): WordStatusVariant {
  if (dbStatus === 'mastered' || dbStatus === 'known') return 'known'
  if (dbStatus === 'new') return 'new'
  return 'learning'
}

function displayName(name: string | null | undefined, email: string | undefined): string {
  if (name) return name
  if (email) return email.split('@')[0]
  return 'there'
}

// ─── ring progress ───────────────────────────────────────────────────────────

function RingProgress({ value, max, label }: { value: number; max: number; label: string }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, value / max) : 0
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-32">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-muted" />
          <circle
            cx="50" cy="50" r={r} fill="none" strokeWidth="9"
            strokeLinecap="round"
            className="stroke-foreground transition-all duration-500"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">of {max}</span>
        </div>
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = startOfTodayInTimeZone()

  const [profileRes, todayCountRes, dueCountRes, recentWordsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, streak_count, daily_new_limit')
      .eq('id', user!.id)
      .single(),

    supabase
      .from('user_word_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', today.toISOString()),

    supabase
      .from('user_word_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'learning')
      .lte('next_review_at', new Date().toISOString()),

    supabase
      .from('user_word_progress')
      .select('status, word:words(id, word, translation)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const profile = profileRes.data
  const dailyGoal = profile?.daily_new_limit ?? 10
  const todayCount = todayCountRes.count ?? 0
  const dueCount = dueCountRes.count ?? 0
  const streak = profile?.streak_count ?? 0
  const remaining = Math.max(0, dailyGoal - todayCount)

  type RecentRow = {
    status: string
    word: { id: number; word: string; translation: string | null } | null
  }
  const recentWords: RecentRow[] = ((recentWordsRes.data ?? []) as unknown[]).map((row) => {
    const r = row as { status: string; word: unknown }
    const w = Array.isArray(r.word) ? r.word[0] : r.word
    return { status: r.status, word: w as RecentRow['word'] }
  })

  const name = displayName(profile?.display_name, user?.email)

  return (
    <main className="min-h-screen px-4 pt-6">
      <div className="mx-auto max-w-lg space-y-7">

        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </button>
          <button
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
          </button>
        </header>

        {/* Greeting */}
        <section>
          <h1 className="text-2xl font-bold">Welcome back, {name} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {remaining > 0
              ? `Ready to learn ${remaining} new word${remaining !== 1 ? 's' : ''} today?`
              : "You've hit your daily goal — great work!"}
          </p>
        </section>

        {/* Today's progress */}
        <section className="rounded-2xl bg-card px-6 py-6 ring-1 ring-foreground/10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Today&apos;s progress
          </p>
          <div className="flex justify-center">
            <RingProgress value={todayCount} max={dailyGoal} label="Daily goal" />
          </div>
        </section>

        {/* Stat cards */}
        <section className="flex gap-3">
          <StatCard label="Reviews due" value={dueCount} />
          <StatCard label="Day streak" value={streak} />
        </section>

        {/* Action buttons */}
        <section className="space-y-3">
          <Link href="/vocabulary">
            <Button className="w-full h-11 rounded-xl gap-2 text-sm font-semibold">
              <BookOpen className="size-4" />
              Continue learning
            </Button>
          </Link>
          <Link href="/vocabulary/review">
            <Button variant="outline" className="w-full h-11 rounded-xl gap-2 text-sm font-semibold">
              <RotateCcw className="size-4" />
              Start review
              {dueCount > 0 && (
                <span className="ml-auto rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background tabular-nums">
                  {dueCount}
                </span>
              )}
            </Button>
          </Link>
        </section>

        {/* Recent saved words */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent saved words</h2>
            <Link
              href="/vocabulary"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>

          {recentWords.length === 0 ? (
            <div className="rounded-2xl bg-card px-4 py-6 ring-1 ring-foreground/10 text-center">
              <p className="text-sm text-muted-foreground">
                No words saved yet.{' '}
                <Link href="/vocabulary" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Browse vocabulary
                </Link>{' '}
                to add some.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card ring-1 ring-foreground/10 divide-y divide-border overflow-hidden">
              {recentWords.map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-semibold leading-tight truncate">
                      {row.word?.word ?? '—'}
                    </p>
                    {row.word?.translation && (
                      <p className="text-xs text-muted-foreground truncate">{row.word.translation}</p>
                    )}
                  </div>
                  <StatusBadge variant={toStatusVariant(row.status)} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sign out */}
        <section className="pb-4 pt-2">
          <form action={logout}>
            <Button type="submit" variant="ghost" className="w-full text-sm text-muted-foreground">
              Sign out
            </Button>
          </form>
        </section>

      </div>
    </main>
  )
}
