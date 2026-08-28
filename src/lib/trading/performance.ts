import { prisma } from "@/lib/db/prisma"

// Track metrics paper trades, bandingkan dengan backtest awal (Section 28, 29)
export async function trackPerformance() {
  const closedTrades = await prisma.paperPosition.findMany({
    where: { status: "CLOSED" }
  })

  if (closedTrades.length === 0) return

  let wins = 0
  let grossProfit = 0
  let grossLoss = 0
  let maxDrawdown = 0
  let currentCapital = 10000
  let peakCapital = 10000

  for (const trade of closedTrades) {
    if (trade.pnl && trade.pnl > 0) {
      wins++
      grossProfit += trade.pnl
    } else if (trade.pnl && trade.pnl <= 0) {
      grossLoss += Math.abs(trade.pnl)
    }

    currentCapital += trade.pnl || 0
    if (currentCapital > peakCapital) peakCapital = currentCapital
    
    const dd = (peakCapital - currentCapital) / peakCapital * 100
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  const winRate = (wins / closedTrades.length) * 100
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0
  const expectancy = closedTrades.length > 0 ? (grossProfit - grossLoss) / closedTrades.length : 0

  // Asumsi threshold dari backtest awal (MOCK)
  const EXPECTED_WIN_RATE = 65
  const deviation = winRate - EXPECTED_WIN_RATE
  
  // Deteksi Drift
  const degraded = closedTrades.length >= 10 && deviation < -10

  await prisma.performance.create({
    data: {
      strategy: "AI_PAPER_COMPOSITE",
      winRate,
      profitFactor,
      expectancy,
      drawdown: maxDrawdown,
      degraded
    }
  })

  return { winRate, profitFactor, expectancy, drawdown: maxDrawdown, degraded, tradesCount: closedTrades.length }
}
