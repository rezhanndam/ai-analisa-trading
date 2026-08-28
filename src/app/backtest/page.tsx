"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function BacktestPage() {
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null)

  const handleRun = async () => {
    setLoading(true)
    const res = await fetch("/api/backtest", {
      method: "POST",
      body: JSON.stringify({ assetId: "BTC-USDT", timeframe: "1H" })
    })
    const data = await res.json()
    if (data.success) {
      setResult(data.data)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Backtesting</h2>
        <Button onClick={handleRun} disabled={loading}>
          {loading ? "Running..." : "Run BT BTC-USDT 1H"}
        </Button>
      </div>

      {result && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Total Trades</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold tabular-nums">{result.totalTrades}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Win Rate</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold tabular-nums">{result.winRate.toFixed(2)}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Net Profit</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold tabular-nums ${result.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>${result.netProfit.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Max Drawdown</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold tabular-nums text-red-500">{result.maxDrawdown.toFixed(2)}%</div></CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
