import { prisma } from "@/lib/db/prisma"
import { calculateIndicators } from "@/lib/analysis/indicators"
import { detectMarketRegime } from "@/lib/analysis/regime"
import { calculateSetupScore } from "@/lib/analysis/scoring"
import { detectMarketStructure } from "@/lib/analysis/structure"

import { OpenAIEngine } from "@/lib/ai/openai"
import { MockLLMEngine } from "@/lib/ai/engine"
import { calculateRiskMetrics } from "@/lib/ai/risk"
import { FinnhubProvider } from "@/lib/providers/finnhub"
import { BinanceDerivativesProvider } from "@/lib/providers/derivatives"
import { getHistoricalProbability } from "@/lib/analysis/probability"

export async function processAnalysis(assetId: string, timeframe: string) {
  const candles = await prisma.candle.findMany({
    where: { assetId, timeframe },
    orderBy: { openTime: 'asc' }, // old to new
    take: 500 // sufficient for EMA200
  })

  if (candles.length < 200) {
    throw new Error("Insufficient data for analysis. Need at least 200 candles.")
  }

  // Current target is the latest candle
  const latestCandle = candles[candles.length - 1]

  // 1. Indicators
  const indValues = calculateIndicators(candles)
  if (!indValues) throw new Error("Indicator calculation failed")

  // Upsert Indicator Data
  await prisma.indicatorData.upsert({
    where: { candleId: latestCandle.id },
    create: {
      candleId: latestCandle.id,
      assetId,
      timeframe,
      ...indValues
    },
    update: {
      ...indValues
    }
  })

  // 2. Market Regime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regimeData = detectMarketRegime(latestCandle, indValues as any)
  await prisma.marketRegime.upsert({
    where: { candleId: latestCandle.id },
    create: {
      candleId: latestCandle.id,
      assetId,
      timeframe,
      ...regimeData
    },
    update: {
      ...regimeData
    }
  })

  // 4. Market Structure (Pivots)
  const pivots = detectMarketStructure(candles)
  // Get latest 5 pivots to save/update
  const recentPivots = pivots.slice(-5)
  
  for (const pivot of recentPivots) {
    // Basic unique id mapping for pivot
    const pId = `${assetId}-${timeframe}-${pivot.timestamp.getTime()}-${pivot.type}`
    await prisma.marketStructure.upsert({
      where: { id: pId },
      create: {
        id: pId,
        assetId,
        timeframe,
        type: pivot.type,
        price: pivot.price,
        timestamp: pivot.timestamp,
        confidence: "MEDIUM" // Default for Phase 2
      },
      update: {
        price: pivot.price
      }
    })
  }

  // Map pivots to Match AI input requirement
  const aiStructureInput = recentPivots.map(p => ({
    id: "", // Not needed for AI
    assetId,
    timeframe,
    type: p.type,
    price: p.price,
    timestamp: p.timestamp,
    confidence: "MEDIUM"
  }))

  // 4.5. Phase 4: Market Intelligence Data
  const finnhub = new FinnhubProvider()
  const rawNews = await finnhub.fetchNews(assetId)
  const savedNews = []
  for (const n of rawNews) {
    const newsRecord = await prisma.news.create({
      data: {
        assetId,
        title: n.title,
        content: finnhub.sanitizeContent(n.content),
        source: n.source,
        timestamp: n.timestamp,
        sentiment: n.sentiment,
        impact: n.impact
      }
    })
    savedNews.push(newsRecord)
  }

  let derivativeRecord = null
  if (assetId.includes("BTC") || assetId.includes("ETH")) {
    const binanceDeriv = new BinanceDerivativesProvider()
    const derivData = await binanceDeriv.fetchDerivatives(assetId)
    if (derivData) {
      derivativeRecord = await prisma.derivativeData.upsert({
        where: {
          assetId_timestamp: {
            assetId,
            timestamp: derivData.timestamp
          }
        },
        create: {
          assetId,
          timestamp: derivData.timestamp,
          openInterest: derivData.openInterest,
          fundingRate: derivData.fundingRate
        },
        update: {
          openInterest: derivData.openInterest,
          fundingRate: derivData.fundingRate
        }
      })
    }
  }

  const setupType = regimeData.regime.includes("Bull") ? "Trend Continuation" : "Range" // Basic map
  const probability = await getHistoricalProbability(setupType, regimeData.regime, timeframe)

  // 5. Phase 3: AI Engine Integration
  const apiKey = process.env.OPENAI_API_KEY
  const llmEngine = apiKey ? new OpenAIEngine(apiKey) : new MockLLMEngine()

  // Score awal (tanpa RR) untuk AI review gate
  const preScore = calculateSetupScore(latestCandle, {
    indicators: indValues,
    regimeData,
    probability,
    newsSentiment: savedNews.map((n) => n.sentiment),
    riskReward: null
  })

  const aiResult = await llmEngine.evaluate({
    asset: assetId,
    timeframe,
    candle: latestCandle,
    indicators: indValues,
    regime: regimeData,
    score: preScore,
    recentStructure: aiStructureInput,
    news: savedNews,
    derivatives: derivativeRecord,
    probability: probability
  })

  let riskMetrics = null
  if (aiResult.decision !== "NO TRADE") {
    riskMetrics = calculateRiskMetrics(
      latestCandle,
      aiResult.decision as "LONG" | "SHORT",
      indValues.atr14 || (latestCandle.high - latestCandle.low),
      aiStructureInput
    )
  }

  // 5.5. Setup Score final (termasuk Risk/Reward)
  const scoreData = calculateSetupScore(latestCandle, {
    indicators: indValues,
    regimeData,
    probability,
    newsSentiment: savedNews.map((n) => n.sentiment),
    riskReward: riskMetrics?.riskReward ?? null
  })

  await prisma.setupScore.upsert({
    where: { candleId: latestCandle.id },
    create: {
      candleId: latestCandle.id,
      assetId,
      timeframe,
      ...scoreData
    },
    update: {
      ...scoreData
    }
  })

  // 6. Save Signal
  const savedSignal = await prisma.signal.upsert({
    where: { candleId: latestCandle.id },
    create: {
      candleId: latestCandle.id,
      assetId,
      timeframe,
      decision: aiResult.decision,
      setup: aiResult.setup,
      aiScore: aiResult.aiScore,
      invalidation: aiResult.invalidation,
      reasons: JSON.stringify(aiResult.reasons),
      risks: JSON.stringify(aiResult.risks),
      criticResult: aiResult.criticResult,
      status: "VALID",
      entry: riskMetrics?.entry,
      stopLoss: riskMetrics?.stopLoss,
      takeProfit: riskMetrics?.takeProfit,
      riskReward: riskMetrics?.riskReward
    },
    update: {
      decision: aiResult.decision,
      setup: aiResult.setup,
      aiScore: aiResult.aiScore,
      invalidation: aiResult.invalidation,
      reasons: JSON.stringify(aiResult.reasons),
      risks: JSON.stringify(aiResult.risks),
      criticResult: aiResult.criticResult,
      entry: riskMetrics?.entry,
      stopLoss: riskMetrics?.stopLoss,
      takeProfit: riskMetrics?.takeProfit,
      riskReward: riskMetrics?.riskReward
    }
  })

  return {
    candle: latestCandle,
    indicators: indValues,
    regime: regimeData,
    score: scoreData,
    recentPivots,
    signal: savedSignal
  }
}
