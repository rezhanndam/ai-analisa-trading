import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TREND_REGEX = /(Bull|Bear)/

export function RegimeBadge({ regime, confidence }: { regime: string | null; confidence?: number | null }) {
  if (!regime) return null
  const tone = TREND_REGEX.test(regime)
    ? "text-cyan-500 border-cyan-500 bg-cyan-500/10"
    : regime.includes("Sideways")
      ? "text-amber-500 border-amber-500 bg-amber-500/10"
      : "text-muted-foreground border-muted-foreground bg-muted/30"

  return (
    <Badge variant="outline" className={cn(tone, "font-mono")}>
      {regime}
      {confidence !== undefined && confidence !== null && (
        <span className="ml-1 text-xs opacity-70">{confidence.toFixed(0)}%</span>
      )}
    </Badge>
  )
}
