import { NextResponse } from "next/server"
import { processAnalysis } from "@/lib/analysis/engine"

export async function POST(req: Request) {
  try {
    const { assetId, timeframe } = await req.json()
    if (!assetId || !timeframe) return NextResponse.json({ error: "Missing params" }, { status: 400 })

    const result = await processAnalysis(assetId, timeframe)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
