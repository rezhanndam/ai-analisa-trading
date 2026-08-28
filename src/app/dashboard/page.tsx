"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LightweightChart, ChartCandle } from "@/components/charts/LightweightChart"
import { StatusPill } from "@/components/trading/StatusPill"
import { IndicatorTable } from "@/components/trading/IndicatorTable"
import { RegimeBadge } from "@/components/trading/RegimeBadge"
import { SignalCard } from "@/components/trading/SignalCard"
import { ScoreGauge } from "@/components/trading/ScoreGauge"
import { useEffect, useState } from "react"
import { Time } from "lightweight-charts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Dashboard() {
  const [btcData, setBtcData] = useState<ChartCandle[]>([])
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysis, setAnalysis] = useState<any>(null)
  const [timeframe, setTimeframe] = useState("1H")

  const fetchBtcData = async (tf: string) => {
    setLoading(true)
    try {
      await fetch("/api/ingest", {
        method: "POST",
        body: JSON.stringify({ assetId: "BTC-USDT", timeframe: tf }),
      })

      const res = await fetch(`/api/candles?assetId=BTC-USDT&timeframe=${tf}`)
      const data = await res.json()

      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setBtcData(data.map((c: any) => ({
          time: (new Date(c.openTime).getTime() / 1000) as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        })))

        const analysisRes = await fetch("/api/analysis", {
          method: "POST",
          body: JSON.stringify({ assetId: "BTC-USDT", timeframe: tf }),
        })
        const analysisData = await analysisRes.json()
        if (analysisData.success) {
          setAnalysis(analysisData.data)
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBtcData(timeframe)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const latestClose = btcData.length > 0 ? btcData[btcData.length - 1].close : null
  const prevClose = btcData.length > 1 ? btcData[btcData.length - 2].close : null
  const changePct = latestClose && prevClose ? ((latestClose - prevClose) / prevClose) * 100 : 0
  const score = analysis?.score || null

  const timeframes = ["5M", "15M", "1H", "4H", "1D"]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-xs text-muted-foreground">BTC/USDT · last 500 candles · data real</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md overflow-hidden">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => { setTimeframe(tf); fetchBtcData(tf) }}
                className={`px-3 py-1.5 text-xs font-mono transition-colors ${
                  tf === timeframe ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <Button onClick={() => fetchBtcData(timeframe)} disabled={loading} size="sm">
            {loading ? "Syncing..." : "Sync"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">BTC/USDT · {timeframe}</span>
                {analysis?.signal && <StatusPill decision={analysis.signal.decision} />}
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-bold tabular-nums">
                  {latestClose ? latestClose.toLocaleString() : "—"}
                </div>
                <div className={`text-sm font-mono ${changePct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {btcData.length > 0 ? (
                <LightweightChart data={btcData} />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                  {loading ? "Loading data..." : "No data — klik Sync"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Market Regime</span>
                <div className="mt-1">
                  <RegimeBadge regime={analysis?.regime?.regime} confidence={analysis?.regime?.confidence} />
                </div>
              </div>
              {score && (
                <div className="border-t pt-3">
                  <ScoreGauge score={score.totalScore} maxScore={100} />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs">
                    <span className="text-muted-foreground">Trend</span><span className="font-mono">{score.trend}/15</span>
                    <span className="text-muted-foreground">Structure</span><span className="font-mono">{score.structure}/15</span>
                    <span className="text-muted-foreground">Momentum</span><span className="font-mono">{score.momentum}/10</span>
                    <span className="text-muted-foreground">Volume</span><span className="font-mono">{score.volume}/10</span>
                    <span className="text-muted-foreground">Volatility</span><span className="font-mono">{score.volatility}/10</span>
                    <span className="text-muted-foreground">Probability</span><span className="font-mono">{score.probability}/15</span>
                    <span className="text-muted-foreground">Fundamental</span><span className="font-mono">{score.fundamental}/10</span>
                    <span className="text-muted-foreground">Sentiment</span><span className="font-mono">{score.sentiment}/5</span>
                    <span className="text-muted-foreground">Risk/Reward</span><span className="font-mono">{score.riskReward}/10</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <SignalCard signal={analysis?.signal} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <IndicatorTable data={analysis?.indicators} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
