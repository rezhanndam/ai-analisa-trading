import { FetchCandlesParams, MarketDataProvider, ProviderCandle, ProviderConfig } from "./types"

export class BinanceProvider implements MarketDataProvider {
  private baseUrl = "https://api.binance.com/api/v3"

  getConfig(): ProviderConfig {
    return {
      id: "BINANCE",
      name: "Binance Spot API",
      type: "CRYPTO",
    }
  }

  private mapTimeframe(tf: string): string {
    const map: Record<string, string> = {
      "5M": "5m",
      "15M": "15m",
      "1H": "1h",
      "4H": "4h",
      "1D": "1d",
      "1W": "1w",
    }
    return map[tf] || "1h"
  }

  async fetchHistoricalCandles(params: FetchCandlesParams): Promise<ProviderCandle[]> {
    const symbol = params.assetId.replace("-", "") // e.g., BTC-USDT to BTCUSDT
    const interval = this.mapTimeframe(params.timeframe)
    const limit = params.limit || 500

    let url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    if (params.startTime) url += `&startTime=${params.startTime.getTime()}`
    if (params.endTime) url += `&endTime=${params.endTime.getTime()}`

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Binance API error: ${res.statusText}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[][] = await res.json()
    
    return data.map((k) => ({
      openTime: new Date(k[0]),
      closeTime: new Date(k[6]),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  }
}
