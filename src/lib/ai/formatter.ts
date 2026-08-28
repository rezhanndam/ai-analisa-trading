import { Candle, IndicatorData, MarketRegime, SetupScore, MarketStructure, News, DerivativeData, HistoricalProbability } from "@prisma/client"

export interface AIInputData {
  asset: string
  timeframe: string
  candle: Pick<Candle, "open" | "high" | "low" | "close" | "volume" | "closeTime">
  indicators: Partial<IndicatorData>
  regime: Partial<MarketRegime>
  score: Partial<SetupScore>
  recentStructure: MarketStructure[]
  news: News[]
  derivatives: DerivativeData | null
  probability: HistoricalProbability | null
}

export function formatAIInput(data: AIInputData): string {
  return JSON.stringify({
    MARKET_DATA: data.candle,
    TECHNICAL_DATA: data.indicators,
    STRUCTURE_DATA: data.recentStructure.map(s => ({ type: s.type, price: s.price })),
    REGIME_DATA: {
      regime: data.regime.regime,
      confidence: data.regime.confidence,
      features: data.regime.features
    },
    NEWS_DATA: data.news.map(n => ({ title: n.title, sentiment: n.sentiment, impact: n.impact })),
    DERIVATIVES_DATA: data.derivatives ? { oi: data.derivatives.openInterest, funding: data.derivatives.fundingRate } : null,
    HISTORICAL_PROBABILITY: data.probability ? { winRate: data.probability.winRate, sampleSize: data.probability.sampleSize } : null,
    SCORE: data.score.totalScore
  }, null, 2)
}
