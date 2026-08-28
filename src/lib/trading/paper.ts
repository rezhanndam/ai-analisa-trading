import { prisma } from "@/lib/db/prisma"

// Capital paper trading
const STARTING_CAPITAL = 10000
const RISK_PER_TRADE_PCT = 0.01 // 1% risk

export async function processPaperTrades(assetId: string) {
  // 1. Eksekusi Signal Terbaru (yang belum dieksekusi) menjadi Paper Position
  const recentSignals = await prisma.signal.findMany({
    where: { 
      assetId,
      status: "VALID",
      decision: { in: ["LONG", "SHORT"] }
    },
    orderBy: { timestamp: "desc" },
    take: 5
  })

  for (const signal of recentSignals) {
    if (!signal.entry || !signal.stopLoss || !signal.takeProfit) continue

    // Cek apakah posisi untuk sinyal ini sudah ada
    const existing = await prisma.paperPosition.findFirst({
      where: { signalId: signal.id }
    })

    if (!existing) {
      // Risk Management (Position Sizing)
      const riskAmount = STARTING_CAPITAL * RISK_PER_TRADE_PCT
      const distanceToSl = Math.abs(signal.entry - signal.stopLoss)
      const size = distanceToSl > 0 ? riskAmount / distanceToSl : 1

      await prisma.paperPosition.create({
        data: {
          signalId: signal.id,
          assetId: signal.assetId,
          type: signal.decision,
          size,
          entryPrice: signal.entry,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          status: "OPEN",
        }
      })
    }
  }

  // 2. Update P&L & Close Posisi jika SL/TP tersentuh
  const openPositions = await prisma.paperPosition.findMany({
    where: { assetId, status: "OPEN" }
  })

  if (openPositions.length === 0) return

  // Ambil candle harga terbaru untuk mengecek apakah stop/loss kena
  const latestCandle = await prisma.candle.findFirst({
    where: { assetId },
    orderBy: { openTime: "desc" }
  })

  if (!latestCandle) return

  for (const pos of openPositions) {
    let closed = false
    let closePrice = 0

    if (pos.type === "LONG") {
      if (pos.stopLoss && latestCandle.low <= pos.stopLoss) {
        closePrice = pos.stopLoss
        closed = true
      } else if (pos.takeProfit && latestCandle.high >= pos.takeProfit) {
        closePrice = pos.takeProfit
        closed = true
      }
    } else if (pos.type === "SHORT") {
      if (pos.stopLoss && latestCandle.high >= pos.stopLoss) {
        closePrice = pos.stopLoss
        closed = true
      } else if (pos.takeProfit && latestCandle.low <= pos.takeProfit) {
        closePrice = pos.takeProfit
        closed = true
      }
    }

    if (closed) {
      const isLong = pos.type === "LONG"
      const pnl = isLong 
        ? (closePrice - pos.entryPrice) * pos.size
        : (pos.entryPrice - closePrice) * pos.size

      await prisma.paperPosition.update({
        where: { id: pos.id },
        data: {
          status: "CLOSED",
          closePrice,
          closeTime: new Date(),
          pnl
        }
      })
    } else {
      // Hanya Update P&L Real-time (Unrealized)
      const isLong = pos.type === "LONG"
      const unrealizedPnl = isLong 
        ? (latestCandle.close - pos.entryPrice) * pos.size
        : (pos.entryPrice - latestCandle.close) * pos.size
        
      await prisma.paperPosition.update({
        where: { id: pos.id },
        data: { pnl: unrealizedPnl }
      })
    }
  }
}
