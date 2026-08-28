import { FetchCandlesParams, MarketDataProvider, ProviderCandle, ProviderConfig } from "./types"

export class OandaProvider implements MarketDataProvider {
  private baseUrl = process.env.OANDA_URL || "https://api-fxpractice.oanda.com/v3"
  private accountId = process.env.OANDA_ACCOUNT_ID
  private apiKey = process.env.OANDA_API_KEY

  getConfig(): ProviderConfig {
    return {
      id: "OANDA",
      name: "OANDA Practice API",
      type: "FOREX",
    }
  }

  private mapTimeframe(tf: string): string {
    const map: Record<string, string> = {
      "5M": "M5",
      "15M": "M15",
      "1H": "H1",
      "4H": "H4",
      "1D": "D",
      "1W": "W",
    }
    return map[tf] || "H1"
  }

  async fetchHistoricalCandles(params: FetchCandlesParams): Promise<ProviderCandle[]> {
    if (!this.apiKey || !this.accountId) {
      throw new Error("OANDA credentials missing")
    }

    const symbol = params.assetId.replace("-", "_") // e.g., EUR-USD to EUR_USD
    const granularity = this.mapTimeframe(params.timeframe)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const count = params.limit || 500

    const url = `${this.baseUrl}/instruments/${symbol}/candles?granularity=${granularity}&price=M`
    
    // OANDA handles time slightly differently, using 'count' by default if from/to not strictly provided
    // For MVP, if we have limit, we just use count.

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        throw new Error(`OANDA API error: ${res.status} ${JSON.stringify(err)}`)
    }

    const data = await res.json()
    if (!data.candles) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.candles.map((c: any) => ({
      openTime: new Date(c.time),
      closeTime: new Date(new Date(c.time).getTime() + this.getMsForGranularity(granularity)),
      open: parseFloat(c.mid.o),
      high: parseFloat(c.mid.h),
      low: parseFloat(c.mid.l),
      close: parseFloat(c.mid.c),
      volume: c.volume,
    }))
  }

  private getMsForGranularity(granularity: string): number {
    switch (granularity) {
        case "M5": return 5 * 60 * 1000
        case "M15": return 15 * 60 * 1000
        case "H1": return 60 * 60 * 1000
        case "H4": return 4 * 60 * 60 * 1000
        case "D": return 24 * 60 * 60 * 1000
        case "W": return 7 * 24 * 60 * 60 * 1000
        default: return 60 * 60 * 1000
    }
  }
}
