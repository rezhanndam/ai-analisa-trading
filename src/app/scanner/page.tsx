"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { StatusPill } from "@/components/trading/StatusPill"

export default function ScannerPage() {
  const [tf, setTf] = useState("1H")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const scan = async () => {
    setLoading(true)
    try {
      await fetch("/api/ingest", { method: "POST", body: JSON.stringify({ assetId: "BTC-USDT", timeframe: tf }) })
      const res = await fetch("/api/analysis", { method: "POST", body: JSON.stringify({ assetId: "BTC-USDT", timeframe: tf }) })
      const data = await res.json()
      if (data.success) {
        setRows([{ symbol: "BTC/USDT", tf, ...data.data }])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Market Scanner</h2>
        <div className="flex items-center gap-2">
          <select value={tf} onChange={(e) => setTf(e.target.value)} className="px-3 py-1.5 rounded-md border bg-background text-sm">
            {["5M", "15M", "1H", "4H", "1D"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={scan} disabled={loading} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50">
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>
      </div>

      {rows === null ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Belum ada hasil. Klik <span className="font-mono">Scan</span> untuk memindai BTC/USDT {tf}.
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Tidak ada setup ditemukan.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hasil Scan</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-2 pr-4">Symbol</th>
                  <th className="py-2 pr-4">TF</th>
                  <th className="py-2 pr-4">Regime</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Signal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-mono">{r.symbol}</td>
                    <td className="py-2 pr-4 font-mono">{r.tf}</td>
                    <td className="py-2 pr-4 text-xs">{r.regime.regime}</td>
                    <td className="py-2 pr-4 font-mono">{r.score.totalScore}/100</td>
                    <td className="py-2 pr-4"><StatusPill decision={r.signal.decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
