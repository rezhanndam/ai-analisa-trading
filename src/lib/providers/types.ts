export interface ProviderConfig {
  id: string
  name: string
  type: "CRYPTO" | "FOREX" | "NEWS"
}

export interface FetchCandlesParams {
  assetId: string // e.g., "BTC-USDT"
  timeframe: string // "5M", "1H", etc.
  limit?: number
  startTime?: Date
  endTime?: Date
}

export interface ProviderCandle {
  openTime: Date
  closeTime: Date
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

export interface MarketDataProvider {
  getConfig(): ProviderConfig
  fetchHistoricalCandles(params: FetchCandlesParams): Promise<ProviderCandle[]>
}
