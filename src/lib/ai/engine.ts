import { AIInputData } from "./formatter"

export interface AISignalResult {
  decision: "LONG" | "SHORT" | "NO TRADE"
  setup: string
  aiScore: number
  invalidation: string
  reasons: string[]
  risks: string[]
  criticResult: string
}

export class MockLLMEngine {
  async evaluate(input: AIInputData): Promise<AISignalResult> {
    const minScore = 40 // minimum_score_for_ai_review

    if ((input.score.totalScore || 0) < minScore) {
      return {
        decision: "NO TRADE",
        setup: "None",
        aiScore: input.score.totalScore || 0,
        invalidation: "N/A",
        reasons: ["Deterministic score too low"],
        risks: [],
        criticResult: "Rejected at Analyst stage due to low score."
      }
    }

    // Mock Analyst
    let decision: "LONG" | "SHORT" | "NO TRADE" = "NO TRADE"
    let setup = "Unknown"
    
    if (input.regime.regime?.includes("Bull")) {
      decision = "LONG"
      setup = "Trend Continuation"
    } else if (input.regime.regime?.includes("Bear")) {
      decision = "SHORT"
      setup = "Trend Continuation"
    }

    // Mock Critic & Judge
    const criticResult = "Moderate risk. ATR is stable. No obvious conflict."
    let finalDecision = decision
    const risks = []

    if (input.indicators.rsi14 && input.indicators.rsi14 > 70 && decision === "LONG") {
      risks.push("RSI Overbought")
      finalDecision = "NO TRADE"
    }

    if (input.news && input.news.some(n => n.impact === "CRITICAL")) {
      risks.push("Critical News Pending")
      finalDecision = "NO TRADE"
    }

    if (input.probability && input.probability.sampleSize < 50) {
      risks.push("LOW SAMPLE WARNING: Historical probability lacks data.")
    }

    return {
      decision: finalDecision,
      setup,
      aiScore: Math.min((input.score.totalScore || 0) * 1.5, 100), // Boosted slightly by "AI"
      invalidation: `${input.timeframe} close below/above EMA50`,
      reasons: [
        `Market regime is ${input.regime.regime}`,
        `Score is ${input.score.totalScore}`
      ],
      risks,
      criticResult
    }
  }
}
