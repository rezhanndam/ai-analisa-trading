import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get("assetId")
  const timeframe = searchParams.get("timeframe")

  if (!assetId || !timeframe) return NextResponse.json({ error: "Missing params" }, { status: 400 })

  const candles = await prisma.candle.findMany({
    where: { assetId, timeframe },
    orderBy: { openTime: "asc" },
    take: 500
  })

  return NextResponse.json(candles)
}
