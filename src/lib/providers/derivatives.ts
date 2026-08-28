export class BinanceDerivativesProvider {
  private baseUrl = "https://fapi.binance.com/fapi/v1"

  async fetchDerivatives(symbol: string) {
    try {
      const cleanSymbol = symbol.replace("-", "")
      
      // Open Interest
      const oiRes = await fetch(`${this.baseUrl}/openInterest?symbol=${cleanSymbol}`)
      const oiData = await oiRes.json()

      // Funding Rate
      const fundRes = await fetch(`${this.baseUrl}/premiumIndex?symbol=${cleanSymbol}`)
      const fundData = await fundRes.json()

      return {
        timestamp: new Date(),
        openInterest: parseFloat(oiData.openInterest || "0"),
        fundingRate: parseFloat(fundData.lastFundingRate || "0"),
      }
    } catch (error) {
      console.error("Derivatives fetch failed:", error)
      return null
    }
  }
}
