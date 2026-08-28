"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { SignalCard } from "@/components/trading/SignalCard"
import { Signal } from "@prisma/client"

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/signals")
      .then((r) => r.json())
      .then((data) => {
        setSignals(data)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Signal History</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Last 50 signals</span>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
           <div className="h-64 bg-muted animate-pulse rounded-xl" />
           <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      ) : signals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
            <span className="text-4xl mb-3">📡</span>
            Belum ada signal yang dihasilkan AI. <br/>
            Pastikan scheduler berjalan atau klik Sync Data di Dashboard.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 items-start">
          {signals.map((s) => (
            <SignalCard key={s.id} signal={s as never} className="shadow-sm hover:shadow-md transition-shadow" />
          ))}
        </div>
      )}
    </div>
  )
}