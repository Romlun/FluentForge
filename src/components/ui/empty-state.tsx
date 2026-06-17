import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  heading: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, heading, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-12 text-center", className)}>
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold leading-tight">{heading}</h3>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
