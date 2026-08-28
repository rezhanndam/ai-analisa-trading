import { Candle } from "@prisma/client"

interface IndicatorValues {
  rsi14?: number | null
  macdLine?: number | null
  macdSignal?: number | null
  adx14?: number | null
  atr14?: number | null
}

interface RegimeData {
  regime: string
  confidence?: number | null
  features?: string | null
}

interface ScoringInput {
  indicators: IndicatorValues
  regimeData: RegimeData
  probability: { sampleSize: number; winRate: number } | null
  newsSentiment: string[]
  riskReward: number | null
}

// Section 18 default weights (total 100):
// Trend 15, Structure 15, Momentum 10, Volume 10, Volatility 10,
// Historical Probability 15, Fundamental 10, Sentiment 5, Risk/Reward 10
export function calculateSetupScore(candle: Candle, input: ScoringInput) {
  const { indicators, regimeData, probability, newsSentiment, riskReward } = input

  let trend = 0 // max 15
  let structure = 0 // max 15
  let momentum = 0 // max 10
  let volume = 0 // max 10
  let volatility = 0 // max 10
  let probabilityScore = 0 // max 15
  let fundamental = 0 // max 10
  let sentiment = 0 // max 5
  let rrScore = 0 // max 10

  // 1. Trend (15)
  if (regimeData.regime === "Strong Bull Trend" || regimeData.regime === "Strong Bear Trend") {
    trend = 15
  } else if (regimeData.regime === "Weak Bull Trend" || regimeData.regime === "Weak Bear Trend") {
    trend = 8
  } else {
    trend = 2
  }

  // 2. Momentum (10)
  if (indicators.rsi14) {
    if ((indicators.rsi14 > 50 && indicators.rsi14 < 70) || (indicators.rsi14 < 50 && indicators.rsi14 > 30)) {
      momentum += 5
    }
  }
  if (indicators.macdLine != null && indicators.macdSignal != null) {
    if (Math.abs(indicators.macdLine) > Math.abs(indicators.macdSignal)) {
      momentum += 5
    }
  }

  // 3. Volatility (10)
  if (indicators.adx14 && indicators.adx14 > 25) {
    volatility += 10
  } else if (indicators.adx14 && indicators.adx14 > 20) {
    volatility += 5
  }

  // 4. Volume (10) — baseline bila data volume ada
  if (candle.volume !== null && candle.volume > 0) {
    volume = 5
  }

  // 5. Structure (15) — pivot detection, baseline untuk sekarang
  structure = 5

  // 6. Historical Probability (15) — sample size + win rate
  if (probability && probability.sampleSize > 0) {
    probabilityScore = Math.min((probability.winRate / 100) * 15, 15)
    if (probability.sampleSize < 50) probabilityScore *= 0.5 // low sample penalty
  }

  // 7. Fundamental (10) — placeholder deterministic; news impact HIGH menambah
  fundamental = 5

  // 8. Sentiment (5)
  if (newsSentiment.length > 0) {
    const positives = newsSentiment.filter((s) => s === "POSITIVE").length
    const negatives = newsSentiment.filter((s) => s === "NEGATIVE").length
    const net = positives - negatives
    sentiment = Math.min(Math.max((net / newsSentiment.length + 1) * 2.5, 0), 5)
  }

  // 9. Risk/Reward (10)
  if (riskReward && riskReward > 0) {
    rrScore = Math.min(riskReward * 3, 10)
  }

  const totalScore = trend + structure + momentum + volume + volatility + probabilityScore + fundamental + sentiment + rrScore

  return {
    trend,
    structure,
    momentum,
    volume,
    volatility,
    probability: probabilityScore,
    fundamental,
    sentiment,
    riskReward: rrScore,
    totalScore
  }
}
