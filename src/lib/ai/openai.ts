import OpenAI from "openai"
import { AIInputData } from "./formatter"
import { AISignalResult } from "./engine"

export class OpenAIEngine {
  private client: OpenAI | null = null
  private model: string = "gpt-4o-mini"

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    if (apiKey) {
      this.client = new OpenAI({ apiKey })
      this.model = model
    } else {
      console.warn("OpenAIEngine: No API key provided, using mock fallback")
    }
  }

  async evaluate(input: AIInputData): Promise<AISignalResult> {
    if (!this.client) {
      // Fallback to mock logic
      const { MockLLMEngine } = await import("./engine")
      const mock = new MockLLMEngine()
      return mock.evaluate(input)
    }

    const systemPrompt = `You are an AI Trading Analyst. Given the following market data, analyze and produce a trading signal.
Output JSON with fields: decision (LONG/SHORT/NO_TRADE), setup (string), aiScore (0-100), invalidation (string), reasons (string[]), risks (string[]), criticResult (string).
Base decision on evidence. If insufficient evidence, return NO_TRADE.`

    const userPrompt = JSON.stringify(input, null, 2)

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      })

      const raw = completion.choices[0]?.message?.content
      if (!raw) throw new Error("Empty response from OpenAI")

      const parsed = JSON.parse(raw) as Partial<AISignalResult>

      // Validate required fields
      if (!parsed.decision || !["LONG", "SHORT", "NO TRADE"].includes(parsed.decision)) {
        parsed.decision = "NO TRADE"
      }

      return {
        decision: parsed.decision as "LONG" | "SHORT" | "NO TRADE",
        setup: parsed.setup || "Unknown",
        aiScore: typeof parsed.aiScore === "number" ? parsed.aiScore : 0,
        invalidation: parsed.invalidation || "N/A",
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        criticResult: parsed.criticResult || "No critique provided"
      }
    } catch (error) {
      console.error("OpenAI evaluation failed:", error)
      // Fallback to mock
      const { MockLLMEngine } = await import("./engine")
      const mock = new MockLLMEngine()
      return mock.evaluate(input)
    }
  }
}