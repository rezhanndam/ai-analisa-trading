import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries, ColorType } from "lightweight-charts"
import React, { useEffect, useRef } from "react"

export interface ChartCandle {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

interface LightweightChartProps {
  data: ChartCandle[]
  className?: string
}

export function LightweightChart({ data, className }: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#D9D9D9",
      },
      grid: {
        vertLines: { color: "#2B2B40" },
        horzLines: { color: "#2B2B40" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    })
    chartRef.current = chart

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981", // color-long
      downColor: "#ef4444", // color-short
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    })
    seriesRef.current = candlestickSeries

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data)
    }
  }, [data])

  return <div ref={chartContainerRef} className={`w-full h-[400px] ${className || ""}`} />
}
