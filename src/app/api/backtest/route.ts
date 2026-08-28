import { NextResponse } from "next/server"
import { runBacktest, runWalkForward } from "@/lib/analysis/backtest"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { assetId, timeframe, mode } = await req.json()
    if (!assetId || !timeframe) return NextResponse.json({ error: "Missing params" }, { status: 400 })

    const options = { assetId, timeframe, feeRate: 0.001, spread: 10 }

    if (mode === "walk-forward") {
      const results = await runWalkForward(options)
      return NextResponse.json({ success: true, mode: "walk-forward", results })
    }

    const result = await runBacktest(options)
    return NextResponse.json({ success: true, mode: "backtest", data: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
