"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Home, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Home",       href: "/dashboard",         icon: Home },
  { label: "Vocabulary", href: "/vocabulary",         icon: BookOpen },
  { label: "Review",     href: "/vocabulary/review",  icon: RotateCcw },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  active && "stroke-[2.5px]"
                )}
              />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
