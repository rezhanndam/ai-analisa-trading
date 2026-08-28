interface IndicatorData {
  ema20: number | null
  ema50: number | null
  ema100: number | null
  ema200: number | null
  rsi14: number | null
  adx14: number | null
  atr14: number | null
  macdLine: number | null
  macdSignal: number | null
}

function Row({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex justify-between py-1 text-xs border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value === null || value === undefined ? "—" : value.toFixed(value < 10 ? 4 : 2)}</span>
    </div>
  )
}

export function IndicatorTable({ data }: { data: IndicatorData | null }) {
  if (!data) return <p className="text-xs text-muted-foreground">No indicator data</p>
  return (
    <div>
      <Row label="EMA 20" value={data.ema20} />
      <Row label="EMA 50" value={data.ema50} />
      <Row label="EMA 100" value={data.ema100} />
      <Row label="EMA 200" value={data.ema200} />
      <Row label="RSI 14" value={data.rsi14} />
      <Row label="ADX 14" value={data.adx14} />
      <Row label="ATR 14" value={data.atr14} />
      <Row label="MACD" value={data.macdLine} />
      <Row label="MACD Signal" value={data.macdSignal} />
    </div>
  )
}
