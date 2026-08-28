import cron from "node-cron"
import { prisma } from "@/lib/db/prisma"
import { ingestData } from "@/lib/providers/ingest"
import { processAnalysis } from "@/lib/analysis/engine"
import { logSystemHealth } from "@/lib/observability/logger"
import { trackPerformance } from "@/lib/trading/performance"
import { processPaperTrades } from "@/lib/trading/paper"

// Section 19: scan frequency per timeframe (bukan polling terus-menerus)
const SCAN_SCHEDULE: Record<string, string> = {
  "5M": "*/5 * * * *",   // tiap 5 menit
  "15M": "*/15 * * * *", // tiap 15 menit
  "1H": "0 * * * *",     // tiap jam
  "4H": "0 */4 * * *",   // tiap 4 jam
  "1D": "0 0 * * *",     // tiap hari (candle 1D close)
}

// Section 19: LLM hanya dipanggil setelah deterministic score melewati threshold
const minimum_score_for_ai_review = Number(process.env.MINIMUM_SCORE_FOR_AI_REVIEW || 40)

export async function scanAsset(assetId: string, timeframe: string) {
  const start = Date.now()
  try {
    await ingestData(assetId, timeframe)
    const result = await processAnalysis(assetId, timeframe)

    // Lakukan simulasi paper trading loop berdasarkan data terbaru
    await processPaperTrades(assetId)
    // Pantau dan update performa
    await trackPerformance()

    // Log: apakah LLM dipanggil atau langsung NO TRADE karena score rendah
    const llmInvoked = (result.score?.totalScore || 0) >= minimum_score_for_ai_review
    await logSystemHealth("SCANNER", true, Date.now() - start)

    console.log(
      `[SCAN] ${assetId} ${timeframe} -> ${result.signal?.decision} score=${result.score?.totalScore} llm=${llmInvoked}`
    )
    return result
  } catch (error) {
    console.error(`[SCAN] FAILED ${assetId} ${timeframe}:`, error)
    await logSystemHealth("SCANNER", false, Date.now() - start, 1)
    return null
  }
}

export function startScheduler() {
  const enabled = process.env.ENABLE_SCHEDULER === "true"
  if (!enabled) {
    console.log("[SCHEDULER] disabled (set ENABLE_SCHEDULER=true untuk aktif)")
    return
  }

  const scanAssetOnce = async () => {
    const assets = await prisma.asset.findMany({ where: { isActive: true } })
    for (const asset of assets) {
    for (const [tf] of Object.entries(SCAN_SCHEDULE)) {
      // 5M dan 15M hanya untuk crypto; forex pakai timeframe >= 1H di MVP
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      if (asset.type === "FOREX" && (tf === "5M" || tf === "15M")) continue
      await scanAsset(asset.id, tf)
    }
    }
  }

  // Jalanin satu kali saat start, lalu terjadwal per timeframe
  scanAssetOnce()

  for (const [, cronExpr] of Object.entries(SCAN_SCHEDULE)) {
    cron.schedule(cronExpr, () => scanAssetOnce())
  }

  console.log("[SCHEDULER] started")
}
