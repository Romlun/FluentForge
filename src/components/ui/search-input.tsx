import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps extends React.ComponentProps<"input"> {
  containerClassName?: string
}

export function SearchInput({ className, containerClassName, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center", containerClassName)}>
      <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <input
        type="search"
        className={cn(
          "h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}
