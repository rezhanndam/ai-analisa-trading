import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const performance = await prisma.performance.findMany({
    orderBy: { timestamp: "desc" },
    take: 1
  })

  // Get aggregated stats from paper positions
  const closedPositions = await prisma.paperPosition.findMany({
    where: { status: "CLOSED" }
  })

  let totalPnl = 0
  let totalWins = 0
  let totalLosses = 0

  closedPositions.forEach(p => {
    if (p.pnl && p.pnl > 0) totalWins++
    else totalLosses++
    totalPnl += p.pnl || 0
  })

  return NextResponse.json({
    metrics: performance.length > 0 ? performance[0] : null,
    stats: {
      totalTrades: closedPositions.length,
      totalWins,
      totalLosses,
      totalPnl
    }
  })
}
