import { Card, CardContent } from "@/components/ui/card"
import { StatusPill } from "./StatusPill"
import { ScoreGauge } from "./ScoreGauge"
import { cn } from "@/lib/utils"

interface SignalData {
  decision: string
  setup: string
  aiScore: number
  entry: number | null
  stopLoss: number | null
  takeProfit: number | null
  riskReward: number | null
  invalidation: string | null
  reasons: string
  risks: string
  criticResult: string
}

export function SignalCard({ signal, className }: { signal: SignalData | null; className?: string }) {
  if (!signal) return null

  const reasons = safeParse(signal.reasons)
  const risks = safeParse(signal.risks)

  return (
    <Card className={cn("border-l-4", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <StatusPill decision={signal.decision} />
          <span className="text-xs text-muted-foreground font-mono">{signal.setup}</span>
        </div>

        <ScoreGauge score={signal.aiScore} />

        {signal.entry && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Entry</span>
              <div className="font-mono font-bold">{fmtPrice(signal.entry)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">SL</span>
              <div className="font-mono text-red-500">{fmtPrice(signal.stopLoss!)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">TP</span>
              <div className="font-mono text-emerald-500">{fmtPrice(signal.takeProfit!)}</div>
            </div>
          </div>
        )}

        {signal.riskReward && (
          <div className="text-xs">
            <span className="text-muted-foreground">R:R </span>
            <span className="font-mono font-bold">1:{signal.riskReward.toFixed(2)}</span>
          </div>
        )}

        {reasons.length > 0 && (
          <div className="text-xs space-y-0.5">
            <span className="text-muted-foreground">Reasons</span>
            <ul className="list-disc list-inside text-foreground">
              {reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {risks.length > 0 && (
          <div className="text-xs space-y-0.5">
            <span className="text-red-400">Risks</span>
            <ul className="list-disc list-inside text-red-400">
              {risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {signal.invalidation && signal.invalidation !== "N/A" && (
          <div className="text-xs border-t pt-2 mt-1">
            <span className="text-muted-foreground">Invalidation: </span>
            <span className="font-mono">{signal.invalidation}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Critic: {signal.criticResult}
        </div>
      </CardContent>
    </Card>
  )
}

function safeParse(json: string): string[] {
  try { return JSON.parse(json) } catch { return [] }
}

function fmtPrice(v: number): string {
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}