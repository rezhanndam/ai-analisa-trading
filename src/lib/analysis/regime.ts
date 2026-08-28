import { Candle } from "@prisma/client"

export function detectMarketRegime(
  candle: Candle, 
  indicators: {
    ema20: number
    ema50: number
    ema100: number
    ema200: number
    adx14?: number
    atr14?: number
  }
) {
  const { close } = candle
  const { ema20, ema50, ema100, ema200, adx14 = 0 } = indicators

  let regime = "Transitional / Unclear"
  let confidence = 50
  const features: string[] = []

  // Check Bull Trend
  const isEmaBull = ema20 > ema50 && ema50 > ema100 && ema100 > ema200
  const isEmaBear = ema20 < ema50 && ema50 < ema100 && ema100 < ema200
  
  if (isEmaBull) {
    features.push("EMA_BULL_ALIGNMENT")
    if (close > ema20) {
      features.push("PRICE_ABOVE_EMA20")
      if (adx14 > 25) {
        regime = "Strong Bull Trend"
        confidence = 90
        features.push("ADX_STRONG_TREND")
      } else {
        regime = "Weak Bull Trend"
        confidence = 70
        features.push("ADX_WEAK_TREND")
      }
    } else {
      regime = "Weak Bull Trend"
      confidence = 60
      features.push("PRICE_BELOW_EMA20")
    }
  } else if (isEmaBear) {
    features.push("EMA_BEAR_ALIGNMENT")
    if (close < ema20) {
      features.push("PRICE_BELOW_EMA20")
      if (adx14 > 25) {
        regime = "Strong Bear Trend"
        confidence = 90
        features.push("ADX_STRONG_TREND")
      } else {
        regime = "Weak Bear Trend"
        confidence = 70
        features.push("ADX_WEAK_TREND")
      }
    } else {
      regime = "Weak Bear Trend"
      confidence = 60
      features.push("PRICE_ABOVE_EMA20")
    }
  } else {
    // Check sideways
    if (adx14 < 20) {
      regime = "Sideways / Range"
      confidence = 80
      features.push("ADX_WEAK_TREND")
      features.push("EMA_FLAT")
    }
  }

  return {
    regime,
    confidence,
    features: JSON.stringify(features)
  }
}
