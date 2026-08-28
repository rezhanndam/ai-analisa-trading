"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Performance } from "@prisma/client"

export default function PerformancePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<{ metrics: Performance | null; stats: any } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((res) => {
        setData(res)
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
        <h2 className="text-2xl font-bold tracking-tight">Performance</h2>
        <Badge variant="outline" className="text-muted-foreground">Live Paper Trading Stats</Badge>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : data?.stats?.totalTrades === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center">
            <span className="text-4xl mb-3">📈</span>
            Belum ada posisi yang tertutup (Closed). <br/>
            Metrik performa akan muncul setelah paper trading menyelesaikan siklus trade pertamanya.
          </CardContent>
        </Card>
      ) : (
        <>
          {data?.metrics?.degraded && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <div>
                <strong>⚠️ STRATEGY DRIFT DETECTED</strong>
                <p className="opacity-90 mt-0.5">Win rate telah jatuh secara signifikan di bawah benchmark historis. Pertimbangkan untuk merevisi parameter.</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total P&L</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold tabular-nums ${data!.stats.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {data!.stats.totalPnl >= 0 ? "+" : ""}${data!.stats.totalPnl.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {data?.metrics?.winRate ? data.metrics.winRate.toFixed(1) : ((data!.stats.totalWins / data!.stats.totalTrades) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data!.stats.totalWins} W / {data!.stats.totalLosses} L
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Profit Factor</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {data?.metrics?.profitFactor ? data.metrics.profitFactor.toFixed(2) : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Gross Profit / Gross Loss</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Max Drawdown</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums text-red-500">
                  {data?.metrics?.drawdown ? data.metrics.drawdown.toFixed(2) : "0.00"}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Peak-to-trough decline</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}