import { NextResponse } from "next/server"
import { ingestData } from "@/lib/providers/ingest"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { assetId, timeframe } = await req.json()
    if (!assetId || !timeframe) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const count = await ingestData(assetId, timeframe)
    return NextResponse.json({ success: true, count })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
