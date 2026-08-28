"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { PaperPosition } from "@prisma/client"
import { StatusPill } from "@/components/trading/StatusPill"

export default function PaperTradingPage() {
  const [positions, setPositions] = useState<PaperPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/papertrading")
      .then((r) => r.json())
      .then((data) => {
        setPositions(data)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  const fmtPrice = (v: number | null) => v ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : "—"

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Paper Trading</h2>
        <Badge variant="outline" className="text-muted-foreground">Virtual Portfolio</Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Active & Recent Positions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Loading positions...</div>
          ) : positions.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center">
               <span className="text-4xl mb-3">💼</span>
               Belum ada posisi virtual. <br/> Paper trading berjalan otomatis di background ketika ada sinyal baru.
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Entry</th>
                  <th className="px-4 py-3 font-medium text-right">SL / TP</th>
                  <th className="px-4 py-3 font-medium text-right">P&L</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Open/Close Time</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t">
                {positions.map((p) => {
                  const pnlColor = !p.pnl ? "text-muted-foreground" : p.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{p.assetId}</td>
                      <td className="px-4 py-3"><StatusPill decision={p.type} /></td>
                      <td className="px-4 py-3 font-mono text-right">{fmtPrice(p.entryPrice)}</td>
                      <td className="px-4 py-3 font-mono text-right text-xs">
                        <span className="text-red-400">{fmtPrice(p.stopLoss)}</span>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span className="text-emerald-500">{fmtPrice(p.takeProfit)}</span>
                      </td>
                      <td className={`px-4 py-3 font-mono font-bold text-right ${pnlColor}`}>
                        {p.pnl !== null ? `${p.pnl > 0 ? "+" : ""}$${p.pnl.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={p.status === "OPEN" ? "default" : "secondary"} className={p.status === "OPEN" ? "bg-blue-500 hover:bg-blue-600" : ""}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-right tabular-nums space-y-1">
                        <div>{new Date(p.openTime).toLocaleString()}</div>
                        {p.closeTime && <div>{new Date(p.closeTime).toLocaleString()}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}