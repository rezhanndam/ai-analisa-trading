import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Decision = "LONG" | "SHORT" | "NO TRADE"

// Section 38A: status selalu warna + ikon + teks (bukan warna saja)
const CONFIG: Record<Decision, { label: string; icon: string; className: string }> = {
  LONG: { label: "LONG", icon: "▲", className: "text-emerald-500 border-emerald-500 bg-emerald-500/10" },
  SHORT: { label: "SHORT", icon: "▼", className: "text-red-500 border-red-500 bg-red-500/10" },
  "NO TRADE": { label: "NO TRADE", icon: "■", className: "text-amber-500 border-amber-500 bg-amber-500/10" },
}

export function StatusPill({ decision, className }: { decision: string; className?: string }) {
  const cfg = CONFIG[decision as Decision] || CONFIG["NO TRADE"]
  return (
    <Badge variant="outline" className={cn(cfg.className, "font-mono", className)}>
      <span className="mr-1">{cfg.icon}</span>
      {cfg.label}
    </Badge>
  )
}
