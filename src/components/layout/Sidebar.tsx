"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scanner", label: "Market Scanner" },
  { href: "/signals", label: "Signals" },
  { href: "/backtest", label: "Backtesting" },
  { href: "/walkforward", label: "Walk Forward" },
  { href: "/papertrading", label: "Paper Trading" },
  { href: "/performance", label: "Performance" },
  { href: "/strategy", label: "Strategy Lab" },
  { href: "/status", label: "System Status" },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 border-r bg-background flex flex-col">
      <div className="px-4 py-4 border-b">
        <h1 className="font-bold text-lg tracking-tight">AI Trading</h1>
        <p className="text-[10px] text-muted-foreground">Intelligence System</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-3 py-2 rounded-md text-sm transition-colors",
                active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
