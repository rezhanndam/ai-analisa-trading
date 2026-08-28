"use client"

import { Bell } from "lucide-react"

export function Topbar() {
  return (
    <header className="h-14 border-b flex items-center justify-between px-4">
      <div className="md:hidden font-bold">AI Trading</div>
      <div className="hidden md:block text-xs text-muted-foreground">
        Data: Binance · OANDA practice · semua waktu UTC
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-amber-500 hidden sm:block">⚠️ Bukan nasihat keuangan</span>
        <button className="relative p-2 rounded-md hover:bg-accent" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
