import { cn } from "@/lib/utils"

// Display variants — "new" = no progress row yet, "difficult" = high lapses.
// DB status values are "learning" | "known" (user_word_progress.status).
export type WordStatusVariant = "new" | "learning" | "known" | "difficult"

const variantClasses: Record<WordStatusVariant, string> = {
  new: "bg-[var(--status-new-bg)] text-[var(--status-new-fg)]",
  learning: "bg-[var(--status-learning-bg)] text-[var(--status-learning-fg)]",
  known: "bg-[var(--status-known-bg)] text-[var(--status-known-fg)]",
  difficult: "bg-[var(--status-difficult-bg)] text-[var(--status-difficult-fg)]",
}

const variantLabels: Record<WordStatusVariant, string> = {
  new: "New",
  learning: "Learning",
  known: "Known",
  difficult: "Difficult",
}

interface StatusBadgeProps {
  variant: WordStatusVariant
  className?: string
}

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {variantLabels[variant]}
    </span>
  )
}
