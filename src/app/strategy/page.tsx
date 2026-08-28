"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StrategyLabPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Strategy Lab</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>AI Composite Strategy</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Win Rate</span> <span className="font-bold tabular-nums">68.5%</span></div>
              <div className="flex justify-between"><span>Profit Factor</span> <span className="font-bold tabular-nums">1.82</span></div>
              <div className="flex justify-between"><span>Status</span> <span className="text-emerald-500">STABLE</span></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Baseline Breakout Strategy</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Win Rate</span> <span className="font-bold tabular-nums">54.2%</span></div>
              <div className="flex justify-between"><span>Profit Factor</span> <span className="font-bold tabular-nums">1.12</span></div>
              <div className="flex justify-between"><span>Status</span> <span className="text-amber-500">DEGRADED</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Correlation Risks</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm">
            BTC-USDT ↔ ETH-USDT: <span className="font-bold text-red-500">0.85 (High)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Warning: Trading both pairs simultaneously increases portfolio exposure.</p>
        </CardContent>
      </Card>
    </div>
  )
}
