"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "default" | "success" | "error" | "info"

const variantClasses: Record<ToastVariant, string> = {
  default: "bg-card border-border text-foreground",
  success: "bg-[var(--status-learning-bg)] border-[var(--status-learning-fg)]/30 text-[var(--status-learning-fg)]",
  error: "bg-destructive/10 border-destructive/30 text-destructive",
  info: "bg-[var(--status-new-bg)] border-[var(--status-new-fg)]/30 text-[var(--status-new-fg)]",
}

interface ToastProps {
  variant?: ToastVariant
  icon?: React.ReactNode
  message: string
  onDismiss?: () => void
  className?: string
}

export function Toast({ variant = "default", icon, message, onDismiss, className }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-72 items-center gap-3 rounded-2xl border px-4 py-3 shadow-md",
        variantClasses[variant],
        className
      )}
    >
      {icon && <span className="shrink-0 size-4">{icon}</span>}
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
