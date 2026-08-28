import { Candle } from "@prisma/client"
import { EMA, RSI, ADX, ATR, MACD } from "technicalindicators"

export function calculateIndicators(candles: Candle[]) {
  if (candles.length < 200) return null // Need enough data for EMA200

  const closes = candles.map((c) => c.close)
  const highs = candles.map((c) => c.high)
  const lows = candles.map((c) => c.low)

  // Calculate arrays
  const ema20 = EMA.calculate({ period: 20, values: closes })
  const ema50 = EMA.calculate({ period: 50, values: closes })
  const ema100 = EMA.calculate({ period: 100, values: closes })
  const ema200 = EMA.calculate({ period: 200, values: closes })
  
  const rsi14 = RSI.calculate({ period: 14, values: closes })
  
  const adx14 = ADX.calculate({ period: 14, high: highs, low: lows, close: closes })
  const atr14 = ATR.calculate({ period: 14, high: highs, low: lows, close: closes })
  
  const macd = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  })

  // We only need the latest values for the current candle analysis (the last one in array)
  // Indicators output shorter arrays due to periods, so we take the last element.
  
  return {
    ema20: ema20[ema20.length - 1],
    ema50: ema50[ema50.length - 1],
    ema100: ema100[ema100.length - 1],
    ema200: ema200[ema200.length - 1],
    rsi14: rsi14[rsi14.length - 1],
    adx14: adx14[adx14.length - 1]?.adx,
    atr14: atr14[atr14.length - 1],
    macdLine: macd[macd.length - 1]?.MACD,
    macdSignal: macd[macd.length - 1]?.signal,
  }
}
