"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SystemStatusPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">System Status</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Binance API</CardTitle>
            <Badge className="bg-emerald-500 hover:bg-emerald-500/80">UP</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>Latency: <span className="font-mono">42ms</span></p>
              <p className="text-muted-foreground text-xs">Last checked: Just now</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">OANDA Practice API</CardTitle>
            <Badge className="bg-emerald-500 hover:bg-emerald-500/80">UP</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>Latency: <span className="font-mono">85ms</span></p>
              <p className="text-muted-foreground text-xs">Last checked: 5m ago</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Finnhub News API</CardTitle>
            <Badge className="bg-amber-500 hover:bg-amber-500/80">DEGRADED</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>Latency: <span className="font-mono">420ms</span></p>
              <p className="text-xs text-red-400">Rate limit approaching</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Audit Logs (Recent)</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {`[2026-08-28 02:45 UTC] SYSTEM_START
[2026-08-28 02:46 UTC] INGEST_BINANCE_BTCUSDT_1H SUCCESS
[2026-08-28 02:47 UTC] ANALYST_SCORE_EVAL BTCUSDT 85/100
[2026-08-28 02:47 UTC] LLM_JUDGE_SIGNAL VALID_LONG`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
