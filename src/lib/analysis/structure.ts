import { Candle } from "@prisma/client"

export interface Pivot {
  type: "HH" | "HL" | "LH" | "LL"
  price: number
  index: number
  timestamp: Date
}

// Simple fractal/pivot detection
export function detectMarketStructure(candles: Candle[], leftBars = 5, rightBars = 5): Pivot[] {
  const pivots: Pivot[] = []
  
  for (let i = leftBars; i < candles.length - rightBars; i++) {
    let isHigh = true
    let isLow = true
    
    // Check if i is a high pivot
    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (i !== j && candles[j].high >= candles[i].high) {
        isHigh = false
      }
      if (i !== j && candles[j].low <= candles[i].low) {
        isLow = false
      }
    }
    
    if (isHigh) {
      const lastHigh = pivots.filter(p => p.type === "HH" || p.type === "LH").pop()
      const type = (!lastHigh || candles[i].high > lastHigh.price) ? "HH" : "LH"
      pivots.push({ type, price: candles[i].high, index: i, timestamp: candles[i].openTime })
    }
    
    if (isLow) {
      const lastLow = pivots.filter(p => p.type === "HL" || p.type === "LL").pop()
      const type = (!lastLow || candles[i].low > lastLow.price) ? "HL" : "LL"
      pivots.push({ type, price: candles[i].low, index: i, timestamp: candles[i].openTime })
    }
  }
  
  return pivots
}
