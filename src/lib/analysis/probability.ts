import { prisma } from "@/lib/db/prisma"

export async function getHistoricalProbability(setupType: string, regime: string, timeframe: string) {
  const bucketKey = `${setupType}-${regime}-${timeframe}`
  
  let probability = await prisma.historicalProbability.findUnique({
    where: { bucketKey }
  })

  // Mock initial probability if missing (for phase 4)
  if (!probability) {
    probability = await prisma.historicalProbability.create({
      data: {
        bucketKey,
        setupType,
        regime,
        timeframe,
        sampleSize: 0,
        winRate: 0,
        averageR: 0,
        profitFactor: 0
      }
    })
  }

  return probability
}
