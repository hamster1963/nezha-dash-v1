"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { fetchMonitor } from "@/lib/nezha-api"
import { cn, formatTime } from "@/lib/utils"
import { NezhaMonitor, ServerMonitorChart } from "@/types/nezha-api"
import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import NetworkChartLoading from "./NetworkChartLoading"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"

interface ResultItem {
  created_at: number
  [key: string]: number
}

/**
 * Helper method to calculate packet loss from delay data
 */
const calculatePacketLoss = (delays: number[]): number[] => {
  if (!delays || delays.length === 0) return []

  const packetLossRates: number[] = []
  const windowSize = Math.min(10, Math.max(3, Math.floor(delays.length / 10)))
  const timeoutThreshold = 3000
  const extremeDelayThreshold = 10000

  for (let i = 0; i < delays.length; i++) {
    const currentDelay = delays[i]
    let lossRate = 0

    if (currentDelay === 0 || currentDelay === null || currentDelay === undefined) {
      lossRate = 100
    } else if (currentDelay >= extremeDelayThreshold) {
      lossRate = Math.min(95, 60 + (currentDelay - extremeDelayThreshold) / 1000)
    } else if (currentDelay >= timeoutThreshold) {
      lossRate = Math.min(50, (currentDelay - timeoutThreshold) / 200)
    } else {
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(delays.length, i + Math.ceil(windowSize / 2))
      const windowDelays = delays.slice(start, end).filter((d) => d > 0)

      if (windowDelays.length > 2) {
        const mean = windowDelays.reduce((sum, d) => sum + d, 0) / windowDelays.length
        const variance = windowDelays.reduce((sum, d) => sum + (d - mean) ** 2, 0) / windowDelays.length
        const standardDeviation = Math.sqrt(variance)
        const coefficientOfVariation = standardDeviation / mean

        if (coefficientOfVariation > 0.8) {
          lossRate = Math.min(25, coefficientOfVariation * 15)
        } else if (coefficientOfVariation > 0.5) {
          lossRate = Math.min(10, coefficientOfVariation * 8)
        } else if (coefficientOfVariation > 0.3) {
          lossRate = Math.min(5, coefficientOfVariation * 5)
        }

        if (currentDelay > mean * 2.5) {
          lossRate += Math.min(15, (currentDelay / mean - 2.5) * 10)
        }
      }
    }

    if (i > 0) {
      const alpha = 0.3
      lossRate = alpha * lossRate + (1 - alpha) * packetLossRates[i - 1]
    }

    packetLossRates.push(Math.max(0, Math.min(100, lossRate)))
  }

  return packetLossRates.map((rate) => Number(rate.toFixed(2)))
}

export function NetworkChart({ server_id, show }: { server_id: number; show: boolean }) {
  const { t } = useTranslation()

  const { data: monitorData } = useQuery({
    queryKey: ["monitor", server_id],
    queryFn: () => fetchMonitor(server_id),
    enabled: show,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  })

  if (!monitorData) return <NetworkChartLoading />

  if (monitorData?.success && !monitorData.data) {
    return (
      <>
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm font-medium opacity-40"></p>
          <p className="text-sm font-medium opacity-40 mb-4">{t("monitor.noData")}</p>
        </div>
        <NetworkChartLoading />
      </>
    )
  }

  const transformedData = transformData(monitorData.data)

  const formattedData = formatData(monitorData.data)

  const chartDataKey = Object.keys(transformedData)

  const initChartConfig = {
    avg_delay: {
      label: t("monitor.avgDelay"),
    },
    ...chartDataKey.reduce((acc, key) => {
      acc[key] = {
        label: key,
      }
      return acc
    }, {} as ChartConfig),
  } satisfies ChartConfig

  return (
    <NetworkChartClient
      chartDataKey={chartDataKey}
      chartConfig={initChartConfig}
      chartData={transformedData}
      serverName={monitorData.data[0].server_name}
      formattedData={formattedData}
    />
  )
}

export const NetworkChartClient = React.memo(function NetworkChart({
  chartDataKey,
  chartConfig,
  chartData,
  serverName,
  formattedData,
}: {
  chartDataKey: string[]
  chartConfig: ChartConfig
  chartData: ServerMonitorChart
  serverName: string
  formattedData: ResultItem[]
}) {
  const { t } = useTranslation()

  const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const forcePeakCutEnabled = (window.ForcePeakCutEnabled as boolean) ?? false

  // Change from string to string array for multi-selection
  const [activeCharts, setActiveCharts] = React.useState<string[]>([])
  const [isPeakEnabled, setIsPeakEnabled] = React.useState(forcePeakCutEnabled)

  // Function to clear all selected charts
  const clearAllSelections = useCallback(() => {
    setActiveCharts([])
  }, [])

  // Updated to handle multiple selections
  const handleButtonClick = useCallback((chart: string) => {
    setActiveCharts((prev) => {
      // If chart is already selected, remove it
      if (prev.includes(chart)) {
        return prev.filter((c) => c !== chart)
      }
      // Otherwise, add it to selected charts
      return [...prev, chart]
    })
  }, [])

  const getColorByIndex = useCallback(
    (chart: string) => {
      const index = chartDataKey.indexOf(chart)
      return `hsl(var(--chart-${(index % 10) + 1}))`
    },
    [chartDataKey],
  )

  const chartButtons = useMemo(
    () =>
      chartDataKey.map((key) => {
        const monitorData = chartData[key]
        const lastDelay = monitorData[monitorData.length - 1].avg_delay

        // Calculate average packet loss if available
        const packetLossData = monitorData.filter((item) => item.packet_loss !== undefined).map((item) => item.packet_loss!)
        const avgPacketLoss = packetLossData.length > 0 ? packetLossData.reduce((sum, loss) => sum + loss, 0) / packetLossData.length : null

        return (
          <button
            key={key}
            data-active={activeCharts.includes(key)}
            className={`relative z-30 flex cursor-pointer grow basis-0 flex-col justify-center gap-1 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 text-left data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-6`}
            onClick={() => handleButtonClick(key)}
          >
            <span className="whitespace-nowrap text-xs text-muted-foreground">{key}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-md font-bold leading-none sm:text-lg">{lastDelay.toFixed(2)}ms</span>
              {avgPacketLoss !== null && <span className="text-xs text-muted-foreground">{avgPacketLoss.toFixed(2)}% avg loss</span>}
            </div>
          </button>
        )
      }),
    [chartDataKey, activeCharts, chartData, handleButtonClick],
  )

  const chartElements = useMemo(() => {
    const elements = []

    // If exactly one chart is selected, show delay line and packet loss area
    if (activeCharts.length === 1) {
      const chart = activeCharts[0]
      elements.push(
        <Area
          key="packet-loss-area"
          isAnimationActive={false}
          dataKey="packet_loss"
          stroke="none"
          fill="hsl(45, 100%, 60%)"
          fillOpacity={0.3}
          yAxisId="packet-loss"
        />,
        <Line
          key="delay-line"
          isAnimationActive={false}
          strokeWidth={1}
          type="linear"
          dot={false}
          dataKey="avg_delay"
          stroke={getColorByIndex(chart)}
          yAxisId="delay"
          connectNulls={true}
        />,
      )
    } else if (activeCharts.length > 1) {
      // Multiple charts selected - show only delay lines for selected monitors
      elements.push(
        ...activeCharts.map((chart) => (
          <Line
            key={chart}
            isAnimationActive={false}
            strokeWidth={1}
            type="linear"
            dot={false}
            dataKey={chart}
            stroke={getColorByIndex(chart)}
            name={chart}
            connectNulls={true}
            yAxisId="delay"
          />
        )),
      )
    } else {
      // No selection - show all charts (default view)
      elements.push(
        ...chartDataKey.map((key) => (
          <Line
            key={key}
            isAnimationActive={false}
            strokeWidth={1}
            type="linear"
            dot={false}
            dataKey={key}
            stroke={getColorByIndex(key)}
            connectNulls={true}
            yAxisId="delay"
          />
        )),
      )
    }

    return elements
  }, [activeCharts, chartDataKey, getColorByIndex])

  const processedData = useMemo(() => {
    // Special handling for single chart selection
    let baseData = formattedData
    if (activeCharts.length === 1) {
      const selectedChart = activeCharts[0]
      baseData = chartData[selectedChart].map((item) => ({
        created_at: item.created_at,
        avg_delay: item.avg_delay,
        packet_loss: item.packet_loss ?? 0,
      }))
    }

    if (!isPeakEnabled) {
      return baseData
    }

    // For peak cutting, use the base data
    const data = baseData

    const windowSize = 11 // 增加窗口大小以获取更好的统计效果
    const alpha = 0.3 // EWMA平滑因子

    // 辅助函数：计算中位数
    const getMedian = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    }

    // 辅助函数：异常值处理
    const processValues = (values: number[]) => {
      if (values.length === 0) return null

      const median = getMedian(values)
      const deviations = values.map((v) => Math.abs(v - median))
      const medianDeviation = getMedian(deviations) * 1.4826 // MAD估计器

      // 使用中位数绝对偏差(MAD)进行异常值检测
      const validValues = values.filter(
        (v) =>
          Math.abs(v - median) <= 3 * medianDeviation && // 更严格的异常值判定
          v <= median * 3, // 限制最大值不超过中位数的3倍
      )

      if (validValues.length === 0) return median // 如果没有有效值，返回中位数

      // 计算EWMA
      let ewma = validValues[0]
      for (let i = 1; i < validValues.length; i++) {
        ewma = alpha * validValues[i] + (1 - alpha) * ewma
      }

      return ewma
    }

    // 初始化EWMA历史值
    const ewmaHistory: { [key: string]: number } = {}

    return data.map((point, index) => {
      if (index < windowSize - 1) return point

      const window = data.slice(index - windowSize + 1, index + 1)
      const smoothed = { ...point } as ResultItem

      // Special handling for single chart selection
      if (activeCharts.length === 1) {
        // Process avg_delay for single chart
        const values = window.map((w) => w.avg_delay as number).filter((v) => v !== undefined && v !== null)

        if (values.length > 0) {
          const processed = processValues(values)
          if (processed !== null) {
            if (ewmaHistory.avg_delay === undefined) {
              ewmaHistory.avg_delay = processed
            } else {
              ewmaHistory.avg_delay = alpha * processed + (1 - alpha) * ewmaHistory.avg_delay
            }
            smoothed.avg_delay = ewmaHistory.avg_delay
          }
        }
      } else {
        // Process all chart keys or just the selected ones
        const keysToProcess = activeCharts.length > 0 ? activeCharts : chartDataKey

        keysToProcess.forEach((key) => {
          const values = window.map((w) => w[key]).filter((v) => v !== undefined && v !== null) as number[]

          if (values.length > 0) {
            const processed = processValues(values)
            if (processed !== null) {
              // Apply EWMA smoothing
              if (ewmaHistory[key] === undefined) {
                ewmaHistory[key] = processed
              } else {
                ewmaHistory[key] = alpha * processed + (1 - alpha) * ewmaHistory[key]
              }
              smoothed[key] = ewmaHistory[key]
            }
          }
        })
      }

      return smoothed
    })
  }, [isPeakEnabled, activeCharts, formattedData, chartData, chartDataKey])

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardHeader className="flex flex-col items-stretch space-y-0 p-0 sm:flex-row">
        <div className="flex flex-none flex-col justify-center gap-1 border-b px-6 py-4">
          <CardTitle className="flex flex-none items-center gap-0.5 text-md">{serverName}</CardTitle>
          <CardDescription className="text-xs">
            {chartDataKey.length} {t("monitor.monitorCount")}
          </CardDescription>
          <div className="flex items-center mt-0.5 space-x-2">
            <Switch id="Peak" checked={isPeakEnabled} onCheckedChange={setIsPeakEnabled} />
            <Label className="text-xs" htmlFor="Peak">
              Peak cut
            </Label>
          </div>
        </div>
        <div className="flex flex-wrap w-full">{chartButtons}</div>
      </CardHeader>
      <CardContent className="pr-2 pl-0 py-4 sm:pt-6 sm:pb-6 sm:pr-6 sm:pl-2">
        <div className="relative">
          {activeCharts.length > 0 && (
            <button
              className="absolute -top-2 right-1 z-10 text-xs px-2 py-1 bg-stone-100/80 dark:bg-stone-800/80 backdrop-blur-sm rounded-[5px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={clearAllSelections}
            >
              {t("monitor.clearSelections", "Clear")} ({activeCharts.length})
            </button>
          )}
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <ComposedChart accessibilityLayer data={processedData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="created_at"
                tickLine={true}
                tickSize={3}
                axisLine={false}
                tickMargin={8}
                minTickGap={80}
                ticks={processedData
                  .filter((item, index, array) => {
                    if (array.length < 6) {
                      return index === 0 || index === array.length - 1
                    }

                    // 计算数据的总时间跨度（毫秒）
                    const timeSpan = array[array.length - 1].created_at - array[0].created_at
                    const hours = timeSpan / (1000 * 60 * 60)

                    // 根据时间跨度调整显示间隔
                    if (hours <= 12) {
                      // 12小时内，每60分钟显示一个刻度
                      return index === 0 || index === array.length - 1 || new Date(item.created_at).getMinutes() % 60 === 0
                    }
                    // 超过12小时，每2小时显示一个刻度
                    const date = new Date(item.created_at)
                    return date.getMinutes() === 0 && date.getHours() % 2 === 0
                  })
                  .map((item) => item.created_at)}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  const minutes = date.getMinutes()
                  return minutes === 0 ? `${date.getHours()}:00` : `${date.getHours()}:${minutes}`
                }}
              />
              <YAxis yAxisId="delay" tickLine={false} axisLine={false} tickMargin={15} minTickGap={20} tickFormatter={(value) => `${value}ms`} />
              {activeCharts.length === 1 && (
                <YAxis
                  yAxisId="packet-loss"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={15}
                  minTickGap={20}
                  tickFormatter={(value) => `${value}%`}
                />
              )}
              <ChartTooltip
                isAnimationActive={false}
                content={
                  <ChartTooltipContent
                    indicator={"line"}
                    labelKey="created_at"
                    labelFormatter={(_, payload) => {
                      return formatTime(payload[0].payload.created_at)
                    }}
                    formatter={(value, name) => {
                      let formattedValue: string
                      let label: string

                      if (name === "packet_loss") {
                        formattedValue = `${Number(value).toFixed(2)}%`
                        label = t("monitor.packetLoss", "Packet Loss")
                      } else if (name === "avg_delay") {
                        formattedValue = `${Number(value).toFixed(2)}ms`
                        label = t("monitor.avgDelay", "Avg Delay")
                      } else {
                        // For monitor names (in multi-chart view) - delay data
                        formattedValue = `${Number(value).toFixed(2)}ms`
                        label = name as string
                      }

                      return (
                        <div className="flex flex-1 items-center justify-between leading-none">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="ml-2 font-medium text-foreground tabular-nums">{formattedValue}</span>
                        </div>
                      )
                    }}
                  />
                }
              />
              {activeCharts.length !== 1 && <ChartLegend content={<ChartLegendContent />} />}
              {chartElements}
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
})

const transformData = (data: NezhaMonitor[]) => {
  const monitorData: ServerMonitorChart = {}

  data.forEach((item) => {
    const monitorName = item.monitor_name

    if (!monitorData[monitorName]) {
      monitorData[monitorName] = []
    }

    // Calculate packet loss from delay data if not provided
    const packetLoss = item.packet_loss || calculatePacketLoss(item.avg_delay)

    for (let i = 0; i < item.created_at.length; i++) {
      monitorData[monitorName].push({
        created_at: item.created_at[i],
        avg_delay: item.avg_delay[i],
        packet_loss: packetLoss[i],
      })
    }
  })

  return monitorData
}

const formatData = (rawData: NezhaMonitor[]) => {
  const result: { [time: number]: ResultItem } = {}

  const allTimes = new Set<number>()
  rawData.forEach((item) => {
    item.created_at.forEach((time) => allTimes.add(time))
  })

  const allTimeArray = Array.from(allTimes).sort((a, b) => a - b)

  rawData.forEach((item) => {
    const { monitor_name, created_at, avg_delay } = item

    // Calculate packet loss if not provided
    const packetLoss = item.packet_loss || calculatePacketLoss(avg_delay)

    allTimeArray.forEach((time) => {
      if (!result[time]) {
        result[time] = { created_at: time }
      }

      const timeIndex = created_at.indexOf(time)
      // @ts-expect-error - avg_delay is an array
      result[time][monitor_name] = timeIndex !== -1 ? avg_delay[timeIndex] : null
      // Add packet loss data if available
      if (packetLoss) {
        // @ts-expect-error - packet_loss is calculated
        result[time][`${monitor_name}_packet_loss`] = timeIndex !== -1 ? packetLoss[timeIndex] : null
      }
    })
  })

  return Object.values(result).sort((a, b) => a.created_at - b.created_at)
}
