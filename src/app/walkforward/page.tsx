"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function WalkForwardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        body: JSON.stringify({ assetId: "BTC-USDT", timeframe: "1H", mode: "walk-forward" }),
      })
      const data = await res.json()
      if (data.success) setResults(data.results)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Walk Forward</h2>
        <button onClick={run} disabled={loading} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50">
          {loading ? "Running..." : "Run Walk-Forward"}
        </button>
      </div>

      {results === null ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Klik tombol untuk menjalankan walk-forward test BTC/USDT 1H (rolling train/test).
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Tidak cukup signal untuk walk-forward (min 20).</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-sm">Rolling Windows</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {results.map((r, i) => (
              <div key={i} className="border rounded-md p-3 text-xs space-y-1">
                <p className="font-mono text-muted-foreground">
                  Window {i + 1}: train {new Date(r.window.trainStart).toLocaleDateString()} → test {new Date(r.window.testEnd).toLocaleDateString()}
                </p>
                <p>
                  Train: WR {r.trainMetrics.winRate.toFixed(1)}% · PF {r.trainMetrics.profitFactor.toFixed(2)} · trades {r.trainMetrics.totalTrades}
                </p>
                <p className={r.testMetrics.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}>
                  Test: WR {r.testMetrics.winRate.toFixed(1)}% · PF {r.testMetrics.profitFactor.toFixed(2)} · P&L {r.testMetrics.netProfit.toFixed(2)} · trades {r.testMetrics.totalTrades}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}