import { Candle, MarketStructure } from "@prisma/client"

export function calculateRiskMetrics(
  candle: Candle,
  decision: "LONG" | "SHORT",
  atr: number,
  recentPivots: MarketStructure[]
) {
  const entry = candle.close
  let stopLoss = 0
  let takeProfit = 0

  if (decision === "LONG") {
    // Basic ATR based SL, or recent swing low
    const recentLow = recentPivots.filter(p => p.type.includes("L")).pop()
    const atrSL = entry - (atr * 1.5)
    stopLoss = recentLow && recentLow.price < entry ? Math.max(recentLow.price, atrSL) : atrSL
    
    const risk = entry - stopLoss
    takeProfit = entry + (risk * 2) // Default 1:2 R:R
  } else if (decision === "SHORT") {
    const recentHigh = recentPivots.filter(p => p.type.includes("H")).pop()
    const atrSL = entry + (atr * 1.5)
    stopLoss = recentHigh && recentHigh.price > entry ? Math.min(recentHigh.price, atrSL) : atrSL
    
    const risk = stopLoss - entry
    takeProfit = entry - (risk * 2)
  }

  const riskReward = Math.abs((takeProfit - entry) / (entry - stopLoss))

  return {
    entry,
    stopLoss,
    takeProfit,
    riskReward
  }
}
