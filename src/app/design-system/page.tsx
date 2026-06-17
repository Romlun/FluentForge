"use client"

import { BookOpen, CheckCircle, Info, Search, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ProgressBar } from "@/components/ui/progress-bar"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Toast } from "@/components/ui/toast"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-14">

        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">FluentForge</p>
          <h1 className="mt-1 font-display text-4xl font-bold italic">Design System</h1>
          <p className="mt-2 text-sm text-muted-foreground">Internal preview — not linked from nav.</p>
        </header>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-3">
            <p className="font-display text-5xl font-bold">arouse</p>
            <p className="font-display text-3xl font-bold italic">curiosity</p>
            <p className="text-2xl font-bold">Sans-serif heading (Geist)</p>
            <p className="text-base text-muted-foreground">Body copy — sans-serif, muted foreground.</p>
            <p className="text-sm">Small body text.</p>
          </div>
        </Section>

        {/* Palette */}
        <Section title="Palette">
          <div className="flex flex-wrap gap-3">
            <div className="h-12 w-12 rounded-lg bg-background ring-1 ring-border" title="background (cream)" />
            <div className="h-12 w-12 rounded-lg bg-primary" title="primary (black)" />
            <div className="h-12 w-12 rounded-lg bg-secondary ring-1 ring-border" title="secondary" />
            <div className="h-12 w-12 rounded-lg bg-muted" title="muted" />
            <div className="h-12 w-12 rounded-lg bg-destructive" title="destructive" />
            <div className="h-12 w-12 rounded-lg bg-[var(--status-new-bg)] ring-1 ring-[var(--status-new-fg)]/20" title="status-new" />
            <div className="h-12 w-12 rounded-lg bg-[var(--status-learning-bg)] ring-1 ring-[var(--status-learning-fg)]/20" title="status-learning" />
            <div className="h-12 w-12 rounded-lg bg-[var(--status-known-bg)] ring-1 ring-[var(--status-known-fg)]/20" title="status-known" />
            <div className="h-12 w-12 rounded-lg bg-[var(--status-difficult-bg)] ring-1 ring-[var(--status-difficult-fg)]/20" title="status-difficult" />
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Primary</Button>
            <Button variant="outline">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="default" disabled>Disabled</Button>
            <Button size="lg" variant="default">Large</Button>
            <Button size="sm" variant="default">Small</Button>
          </div>
        </Section>

        {/* Status Badges */}
        <Section title="Status Badges">
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="new" />
            <StatusBadge variant="learning" />
            <StatusBadge variant="known" />
            <StatusBadge variant="difficult" />
          </div>
        </Section>

        {/* Progress Bar */}
        <Section title="Progress Bar">
          <div className="space-y-4">
            <ProgressBar value={0} max={10} label="0 of 10 words reviewed" />
            <ProgressBar value={4} max={10} label="4 of 10 words reviewed" />
            <ProgressBar value={10} max={10} label="Daily goal complete!" />
          </div>
        </Section>

        {/* Search Input */}
        <Section title="Search Input">
          <SearchInput placeholder="Search vocabulary…" className="max-w-sm" />
        </Section>

        {/* Toast */}
        <Section title="Toast / Notification">
          <div className="flex flex-col gap-3">
            <Toast
              variant="default"
              icon={<Info className="size-4" />}
              message="Review session saved."
              onDismiss={() => undefined}
            />
            <Toast
              variant="success"
              icon={<CheckCircle className="size-4" />}
              message="Word added to your list!"
              onDismiss={() => undefined}
            />
            <Toast
              variant="error"
              message="Something went wrong. Try again."
              onDismiss={() => undefined}
            />
            <Toast
              variant="info"
              icon={<Zap className="size-4" />}
              message="5 words due for review."
            />
          </div>
        </Section>

        {/* Empty State */}
        <Section title="Empty State">
          <div className="rounded-xl ring-1 ring-border">
            <EmptyState
              icon={<BookOpen className="size-6" />}
              heading="Nothing due right now"
              description="You've reviewed all your cards. Check back later or add more words to your list."
              action={<Button variant="outline">Browse vocabulary</Button>}
            />
          </div>
        </Section>

      </div>
    </main>
  )
}
