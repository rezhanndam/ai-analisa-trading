import { prisma } from "@/lib/db/prisma"

interface BacktestOptions {
  assetId: string
  timeframe: string
  feeRate: number // e.g. 0.001 for 0.1%
  spread: number // e.g. 0.0001
  slippagePct?: number // e.g. 0.0005 = 0.05%
}

export interface BacktestMetrics {
  totalTrades: number
  winRate: number
  netProfit: number
  profitFactor: number
  maxDrawdown: number
  startingCapital: number
  endingCapital: number
}

interface SimSignal {
  decision: "LONG" | "SHORT"
  entry: number
  stopLoss: number
  takeProfit: number
  openTime: Date
  id: string
}

// Execution cost model (Section 23): spread + fee + slippage
function executionCost(price: number, feeRate: number, slippagePct: number) {
  const fee = price * feeRate
  const slippage = price * slippagePct
  return { fee, slippage }
}

async function simulate(
  signals: SimSignal[],
  options: { assetId: string; timeframe: string; feeRate: number; spread: number; slippagePct: number },
  startingCapital: number
): Promise<BacktestMetrics> {
  const { assetId, timeframe, feeRate, spread, slippagePct } = options

  let netProfit = 0
  let wins = 0
  let totalTrades = 0
  let grossProfit = 0
  let grossLoss = 0
  let currentCapital = startingCapital
  let peakCapital = startingCapital
  let maxDrawdown = 0

  for (const sig of signals) {
    const isLong = sig.decision === "LONG"
    const { fee, slippage } = executionCost(sig.entry, feeRate, slippagePct)
    const totalCost = fee + slippage
    const entryPriceWithSpread = (isLong ? sig.entry + spread : sig.entry - spread) + slippage

    const futureCandles = await prisma.candle.findMany({
      where: {
        assetId,
        timeframe,
        openTime: { gt: sig.openTime }
      },
      orderBy: { openTime: "asc" }
    })

    let pnl = 0
    let exitPrice = 0
    let exitTime = new Date()
    let status = "CLOSED_LOSS"

    for (const fc of futureCandles) {
      if (isLong) {
        if (fc.low <= sig.stopLoss) {
          exitPrice = sig.stopLoss - spread
          pnl = (exitPrice - entryPriceWithSpread) / entryPriceWithSpread * currentCapital - totalCost
          status = "CLOSED_LOSS"
          exitTime = fc.openTime
          break
        }
        if (fc.high >= sig.takeProfit) {
          exitPrice = sig.takeProfit - spread
          pnl = (exitPrice - entryPriceWithSpread) / entryPriceWithSpread * currentCapital - totalCost
          status = "CLOSED_WIN"
          exitTime = fc.openTime
          break
        }
      } else {
        if (fc.high >= sig.stopLoss) {
          exitPrice = sig.stopLoss + spread
          pnl = (entryPriceWithSpread - exitPrice) / entryPriceWithSpread * currentCapital - totalCost
          status = "CLOSED_LOSS"
          exitTime = fc.openTime
          break
        }
        if (fc.low <= sig.takeProfit) {
          exitPrice = sig.takeProfit + spread
          pnl = (entryPriceWithSpread - exitPrice) / entryPriceWithSpread * currentCapital - totalCost
          status = "CLOSED_WIN"
          exitTime = fc.openTime
          break
        }
      }
    }

    if (exitPrice !== 0) {
      await prisma.backtestTrade.create({
        data: {
          backtestId: "TEMP", // replaced after; kept for schema compat, updated below
          signalId: sig.id,
          type: sig.decision,
          entryTime: sig.openTime,
          exitTime,
          entryPrice: entryPriceWithSpread,
          exitPrice,
          stopLoss: sig.stopLoss,
          takeProfit: sig.takeProfit,
          pnl,
          fee: totalCost,
          status
        }
      })

      totalTrades++
      netProfit += pnl
      currentCapital += pnl

      if (pnl > 0) {
        wins++
        grossProfit += pnl
      } else {
        grossLoss += Math.abs(pnl)
      }

      if (currentCapital > peakCapital) peakCapital = currentCapital
      const dd = (peakCapital - currentCapital) / peakCapital * 100
      if (dd > maxDrawdown) maxDrawdown = dd
    }
  }

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0

  return {
    totalTrades,
    winRate,
    netProfit,
    profitFactor,
    maxDrawdown,
    startingCapital,
    endingCapital: currentCapital
  }
}

export async function runBacktest(options: BacktestOptions) {
  const signals = await loadSignals(options.assetId, options.timeframe)

  const backtest = await prisma.backtest.create({
    data: {
      name: `Backtest ${options.assetId} ${options.timeframe}`,
      assetId: options.assetId,
      timeframe: options.timeframe,
      startTime: signals[0]?.openTime || new Date(),
      endTime: signals[signals.length - 1]?.openTime || new Date(),
      status: "RUNNING"
    }
  })

  const metrics = await simulate(signals, {
    assetId: options.assetId,
    timeframe: options.timeframe,
    feeRate: options.feeRate,
    spread: options.spread,
    slippagePct: options.slippagePct || 0.0005
  }, 10000)

  // Fix temp backtestId for trades created during simulation
  await prisma.backtestTrade.updateMany({
    where: { backtestId: "TEMP" },
    data: { backtestId: backtest.id }
  })

  await prisma.backtest.update({
    where: { id: backtest.id },
    data: { ...metrics, status: "COMPLETED" }
  })

  return { backtest, metrics }
}

// Section 25: Walk-Forward — rolling train/test tanpa optimasi pada data test
export async function runWalkForward(options: BacktestOptions, testRatio = 0.3) {
  const signals = await loadSignals(options.assetId, options.timeframe)
  if (signals.length < 20) {
    throw new Error("Insufficient signals for walk-forward (min 20)")
  }

  const windowSize = Math.floor(signals.length / (1 + testRatio))
  const results = []

  let startIdx = 0
  while (startIdx + windowSize < signals.length) {
    const train = signals.slice(startIdx, startIdx + windowSize)
    const test = signals.slice(startIdx + windowSize, startIdx + windowSize + Math.floor(windowSize * testRatio))
    if (test.length === 0) break

    const trainMetrics = await simulate(train, {
      assetId: options.assetId,
      timeframe: options.timeframe,
      feeRate: options.feeRate,
      spread: options.spread,
      slippagePct: options.slippagePct || 0.0005
    }, 10000)

    // Test pakai capital hasil train (rolled forward), tanpa re-optimasi
    const testMetrics = await simulate(test, {
      assetId: options.assetId,
      timeframe: options.timeframe,
      feeRate: options.feeRate,
      spread: options.spread,
      slippagePct: options.slippagePct || 0.0005
    }, trainMetrics.endingCapital)

    results.push({
      window: { trainStart: train[0].openTime, trainEnd: train[train.length - 1].openTime, testEnd: test[test.length - 1].openTime },
      trainMetrics,
      testMetrics
    })

    startIdx += Math.floor(windowSize * testRatio)
  }

  return results
}

async function loadSignals(assetId: string, timeframe: string): Promise<SimSignal[]> {
  const signals = await prisma.signal.findMany({
    where: { assetId, timeframe, decision: { in: ["LONG", "SHORT"] } },
    orderBy: { timestamp: "asc" },
    include: { candle: true }
  })

  return signals
    .filter((s) => s.entry && s.stopLoss && s.takeProfit)
    .map((s) => ({
      decision: s.decision as "LONG" | "SHORT",
      entry: s.entry!,
      stopLoss: s.stopLoss!,
      takeProfit: s.takeProfit!,
      openTime: s.candle.openTime,
      id: s.id
    }))
}
