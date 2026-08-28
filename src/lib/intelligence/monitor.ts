import { prisma } from "@/lib/db/prisma"

export async function checkStrategyDrift(strategyId: string, expectedWinRate: number) {
  const perf = await prisma.performance.findFirst({
    where: { strategy: strategyId },
    orderBy: { timestamp: "desc" }
  })

  if (!perf) return { status: "OK", deviation: 0 }

  const deviation = perf.winRate - expectedWinRate
  
  if (deviation < -10) {
    await prisma.performance.update({
      where: { id: perf.id },
      data: { degraded: true }
    })
    return { status: "WARNING", deviation }
  }

  return { status: "OK", deviation }
}

// Pearson correlation stub
export async function calculateCorrelation(assetA: string, assetB: string, timeframe: string) {
  // Mock logic: fetching candles for both, aligning timestamps, math...
  // Stubbed for MVP to return a dummy value
  
  const correlationVal = 0.85 // Mock high correlation

  await prisma.correlation.create({
    data: {
      assetA,
      assetB,
      timeframe,
      correlation: correlationVal
    }
  })

  return correlationVal
}
