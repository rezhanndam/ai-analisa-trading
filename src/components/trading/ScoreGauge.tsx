export function ScoreGauge({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const pct = Math.min((score / maxScore) * 100, 100)
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Score</span>
        <span className="font-mono font-bold">{score}/{maxScore}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}