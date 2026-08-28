import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get("assetId")

  const whereClause = assetId ? { assetId } : {}

  const signals = await prisma.signal.findMany({
    where: whereClause,
    orderBy: { timestamp: "desc" },
    take: 50 // Limit to recent 50 signals
  })

  return NextResponse.json(signals)
}
