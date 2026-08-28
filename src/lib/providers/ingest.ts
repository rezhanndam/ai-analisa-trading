import { prisma } from "@/lib/db/prisma"
import { BinanceProvider } from "@/lib/providers/binance"
import { OandaProvider } from "@/lib/providers/oanda"

export async function ingestData(assetId: string, timeframe: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error("Asset not found")

  const provider = asset.provider === "BINANCE" ? new BinanceProvider() : new OandaProvider()
  
  // Find latest candle to resume from
  const latestCandle = await prisma.candle.findFirst({
    where: { assetId, timeframe },
    orderBy: { openTime: 'desc' }
  })

  const startTime = latestCandle ? new Date(latestCandle.closeTime.getTime() + 1) : undefined
  
  const candles = await provider.fetchHistoricalCandles({
    assetId,
    timeframe,
    startTime,
    limit: 500
  })

  if (candles.length === 0) return 0

  let count = 0
  for (const c of candles) {
    try {
      await prisma.candle.upsert({
        where: {
          assetId_timeframe_openTime: {
            assetId,
            timeframe,
            openTime: c.openTime
          }
        },
        update: {
          close: c.close,
          high: c.high,
          low: c.low,
          volume: c.volume,
          closeTime: c.closeTime
        },
        create: {
          assetId,
          timeframe,
          openTime: c.openTime,
          closeTime: c.closeTime,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume
        }
      })
      count++
    } catch (e) {
      console.error(e)
    }
  }

  return count
}
