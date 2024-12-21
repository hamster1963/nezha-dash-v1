import { Card, CardContent } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { formatBytes } from "@/lib/format"
import { cn, formatNezhaInfo, formatRelativeTime } from "@/lib/utils"
import { NezhaServer, NezhaWebsocketResponse } from "@/types/nezha-api"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { ServerDetailChartLoading } from "./loading/ServerDetailLoading"
import AnimatedCircularProgressBar from "./ui/animated-circular-progress-bar"

type gpuChartData = {
  timeStamp: string
  gpu: number
}

type cpuChartData = {
  timeStamp: string
  cpu: number
}

type processChartData = {
  timeStamp: string
  process: number
}

type diskChartData = {
  timeStamp: string
  disk: number
}

type memChartData = {
  timeStamp: string
  mem: number
  swap: number
}

type networkChartData = {
  timeStamp: string
  upload: number
  download: number
}

type connectChartData = {
  timeStamp: string
  tcp: number
  udp: number
}

export default function ServerDetailChart({ server_id }: { server_id: string }) {
  const { lastMessage, connected } = useWebSocketContext()

  if (!connected && !lastMessage) {
    return <ServerDetailChartLoading />
  }

  const nezhaWsData = lastMessage ? (JSON.parse(lastMessage.data) as NezhaWebsocketResponse) : null

  if (!nezhaWsData) {
    return <ServerDetailChartLoading />
  }

  const server = nezhaWsData.servers.find((s) => s.id === Number(server_id))

  if (!server) {
    return <ServerDetailChartLoading />
  }

  const gpuStats = server.state.gpu || []
  const gpuList = server.host.gpu || []

  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-3 grid-cols-1 gap-3 server-charts">
      <CpuChart now={nezhaWsData.now} data={server} />
      {gpuStats.length >= 1 && gpuList.length === gpuStats.length ? (
        gpuList.map((gpu, index) => <GpuChart now={nezhaWsData.now} gpuStat={gpuStats[index]} gpuName={gpu} key={index} />)
      ) : gpuStats.length > 0 ? (
        gpuStats.map((gpu, index) => <GpuChart now={nezhaWsData.now} gpuStat={gpu} gpuName={`#${index + 1}`} key={index} />)
      ) : (
        <></>
      )}
      <ProcessChart now={nezhaWsData.now} data={server} />
      <DiskChart now={nezhaWsData.now} data={server} />
      <MemChart now={nezhaWsData.now} data={server} />
      <NetworkChart now={nezhaWsData.now} data={server} />
      <ConnectChart now={nezhaWsData.now} data={server} />
    </section>
  )
}

function GpuChart({ now, gpuStat, gpuName }: { now: number; gpuStat: number; gpuName?: string }) {
  const [gpuChartData, setGpuChartData] = useState([] as gpuChartData[])

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  useEffect(() => {
    if (gpuStat) {
      const timestamp = Date.now().toString()
      let newData = [] as gpuChartData[]
      if (gpuChartData.length === 0) {
        newData = [
          { timeStamp: timestamp, gpu: gpuStat },
          { timeStamp: timestamp, gpu: gpuStat },
        ]
      } else {
        newData = [...gpuChartData, { timeStamp: timestamp, gpu: gpuStat }]
      }
      if (newData.length > 30) {
        newData.shift()
      }
      setGpuChartData(newData)
    }
  }, [now, gpuStat])

  const chartConfig = {
    gpu: {
      label: "GPU",
    },
  } satisfies ChartConfig

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardContent className="px-6 py-3">
        <section className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <section className="flex flex-col items-center gap-2">
              {!gpuName && <p className="text-md font-medium">GPU</p>}
              {gpuName && <p className="text-xs mt-1 mb-1.5">GPU: {gpuName}</p>}
            </section>
            <section className="flex items-center gap-2">
              <p className="text-xs text-end w-10 font-medium">{gpuStat.toFixed(2)}%</p>
              <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={gpuStat} primaryColor="hsl(var(--chart-3))" />
            </section>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
            <AreaChart
              accessibilityLayer
              data={gpuChartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={200}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatRelativeTime(value)}
              />
              <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Area isAnimationActive={false} dataKey="gpu" type="step" fill="hsl(var(--chart-3))" fillOpacity={0.3} stroke="hsl(var(--chart-3))" />
            </AreaChart>
          </ChartContainer>
        </section>
      </CardContent>
    </Card>
  )
}

function CpuChart({ now, data }: { now: number; data: NezhaServer }) {
  const [cpuChartData, setCpuChartData] = useState([] as cpuChartData[])

  const { cpu } = formatNezhaInfo(now, data)

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  useEffect(() => {
    if (data) {
      const timestamp = Date.now().toString()
      let newData = [] as cpuChartData[]
      if (cpuChartData.length === 0) {
        newData = [
          { timeStamp: timestamp, cpu: cpu },
          { timeStamp: timestamp, cpu: cpu },
        ]
      } else {
        newData = [...cpuChartData, { timeStamp: timestamp, cpu: cpu }]
      }
      if (newData.length > 30) {
        newData.shift()
      }
      setCpuChartData(newData)
    }
  }, [data])

  const chartConfig = {
    cpu: {
      label: "CPU",
    },
  } satisfies ChartConfig

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardContent className="px-6 py-3">
        <section className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-md font-medium">CPU</p>
            <section className="flex items-center gap-2">
              <p className="text-xs text-end w-10 font-medium">{cpu.toFixed(2)}%</p>
              <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={cpu} primaryColor="hsl(var(--chart-1))" />
            </section>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
            <AreaChart
              accessibilityLayer
              data={cpuChartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={200}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatRelativeTime(value)}
              />
              <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Area isAnimationActive={false} dataKey="cpu" type="step" fill="hsl(var(--chart-1))" fillOpacity={0.3} stroke="hsl(var(--chart-1))" />
            </AreaChart>
          </ChartContainer>
        </section>
      </CardContent>
    </Card>
  )
}

function ProcessChart({ now, data }: { now: number; data: NezhaServer }) {
  const { t } = useTranslation()
  const [processChartData, setProcessChartData] = useState([] as processChartData[])

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const { process } = formatNezhaInfo(now, data)

  useEffect(() => {
    if (data) {
      const timestamp = Date.now().toString()
      let newData = [] as processChartData[]
      if (processChartData.length === 0) {
        newData = [
          { timeStamp: timestamp, process: process },
          { timeStamp: timestamp, process: process },
        ]
      } else {
        newData = [...processChartData, { timeStamp: timestamp, process: process }]
      }
      if (newData.length > 30) {
        newData.shift()
      }
      setProcessChartData(newData)
    }
  }, [data])

  const chartConfig = {
    process: {
      label: "Process",
    },
  } satisfies ChartConfig

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardContent className="px-6 py-3">
        <section className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-md font-medium">{t("serverDetailChart.process")}</p>
            <section className="flex items-center gap-2">
              <p className="text-xs text-end w-10 font-medium">{process}</p>
            </section>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
            <AreaChart
              accessibilityLayer
              data={processChartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={200}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatRelativeTime(value)}
              />
              <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} />
              <Area
                isAnimationActive={false}
                dataKey="process"
                type="step"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.3}
                stroke="hsl(var(--chart-2))"
              />
            </AreaChart>
          </ChartContainer>
        </section>
      </CardContent>
    </Card>
  )
}

function MemChart({ now, data }: { now: number; data: NezhaServer }) {
  const { t } = useTranslation()
  const [memChartData, setMemChartData] = useState([] as memChartData[])

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const { mem, swap } = formatNezhaInfo(now, data)

  useEffect(() => {
    if (data) {
      const timestamp = Date.now().toString()
      let newData = [] as memChartData[]
      if (memChartData.length === 0) {
        newData = [
          { timeStamp: timestamp, mem: mem, swap: swap },
          { timeStamp: timestamp, mem: mem, swap: swap },
        ]
      } else {
        newData = [...memChartData, { timeStamp: timestamp, mem: mem, swap: swap }]
      }
      if (newData.length > 30) {
        newData.shift()
      }
      setMemChartData(newData)
    }
  }, [data])

  const chartConfig = {
    mem: {
      label: "Mem",
    },
    swap: {
      label: "Swap",
    },
  } satisfies ChartConfig

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardContent className="px-6 py-3">
        <section className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <section className="flex items-center gap-4">
              <div className="flex flex-col">
                <p className=" text-xs text-muted-foreground">{t("serverDetailChart.mem")}</p>
                <div className="flex items-center gap-2">
                  <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={mem} primaryColor="hsl(var(--chart-8))" />
                  <p className="text-xs font-medium">{mem.toFixed(0)}%</p>
                </div>
              </div>
              <div className="flex flex-col">
                <p className=" text-xs text-muted-foreground">{t("serverDetailChart.swap")}</p>
                <div className="flex items-center gap-2">
                  <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={swap} primaryColor="hsl(var(--chart-10))" />
                  <p className="text-xs font-medium">{swap.toFixed(0)}%</p>
                </div>
              </div>
            </section>
            <section className="flex flex-col items-end gap-0.5">
              <div className="flex text-[11px] font-medium items-center gap-2">
                {formatBytes(data.state.mem_used)} / {formatBytes(data.host.mem_total)}
              </div>
              <div className="flex text-[11px] font-medium items-center gap-2">
                {data.host.swap_total ? (
                  <>
                    swap: {formatBytes(data.state.swap_used)} / {formatBytes(data.host.swap_total)}
                  </>
                ) : (
                  <>no swap</>
                )}
              </div>
            </section>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
            <AreaChart
              accessibilityLayer
              data={memChartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={200}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatRelativeTime(value)}
              />
              <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Area isAnimationActive={false} dataKey="mem" type="step" fill="hsl(var(--chart-8))" fillOpacity={0.3} stroke="hsl(var(--chart-8))" />
              <Area
                isAnimationActive={false}
                dataKey="swap"
                type="step"
                fill="hsl(var(--chart-10))"
                fillOpacity={0.3}
                stroke="hsl(var(--chart-10))"
              />
            </AreaChart>
          </ChartContainer>
        </section>
      </CardContent>
    </Card>
  )
}

function DiskChart({ now, data }: { now: number; data: NezhaServer }) {
  const { t } = useTranslation()
  const [diskChartData, setDiskChartData] = useState([] as diskChartData[])

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const { disk } = formatNezhaInfo(now, data)

  useEffect(() => {
    if (data) {
      const timestamp = Date.now().toString()
      let newData = [] as diskChartData[]
      if (diskChartData.length === 0) {
        newData = [
          { timeStamp: timestamp, disk: disk },
          { timeStamp: timestamp, disk: disk },
        ]
      } else {
        newData = [...diskChartData, { timeStamp: timestamp, disk: disk }]
      }
      if (newData.length > 30) {
        newData.shift()
      }
      setDiskChartData(newData)
    }
  }, [data])

  const chartConfig = {
    disk: {
      label: "Disk",
    },
  } satisfies ChartConfig

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardContent className="px-6 py-3">
        <section className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-md font-medium">{t("serverDetailChart.disk")}</p>
            <section className="flex flex-col items-end gap-0.5">
              <section className="flex items-center gap-2">
                <p className="text-xs text-end w-10 font-medium">{disk.toFixed(0)}%</p>
                <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={disk} primaryColor="hsl(var(--chart-5))" />
              </section>
              <div className="flex text-[11px] font-medium items-center gap-2">
                {formatBytes(data.state.disk_used)} / {formatBytes(data.host.disk_total)}
              </div>
            </section>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
            <AreaChart
              accessibilityLayer
              data={diskChartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={200}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatRelativeTime(value)}
              />
              <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Area isAnimationActive={false} dataKey="disk" type="step" fill="hsl(var(--chart-5))" fillOpacity={0.3} stroke="hsl(var(--chart-5))" />
            </AreaChart>
          </ChartContainer>
        </section>
      </CardContent>
    </Card>
  )
}

function NetworkChart({ now, data }: { now: number; data: NezhaServer }) {
  const { t } = useTranslation()
  const [networkChartData, setNetworkChartData] = useState([] as networkChartData[])

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const { up, down } = formatNezhaInfo(now, data)

  useEffect(() => {
    if (data) {
      const timestamp = Date.now().toString()
      let newData = [] as networkChartData[]
      if (networkChartData.length === 0) {
        newData = [
          { timeStamp: timestamp, upload: up, download: down },
          { timeStamp: timestamp, upload: up, download: down },
        ]
      } else {
        newData = [...networkChartData, { timeStamp: timestamp, upload: up, download: down }]
      }
      if (newData.length > 30) {
        newData.shift()
      }
      setNetworkChartData(newData)
    }
  }, [data])

  let maxDownload = Math.max(...networkChartData.map((item) => item.download))
  maxDownload = Math.ceil(maxDownload)
  if (maxDownload < 1) {
    maxDownload = 1
  }

  const chartConfig = {
    upload: {
      label: "Upload",
    },
    download: {
      label: "Download",
    },
  } satisfies ChartConfig

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardContent className="px-6 py-3">
        <section className="flex flex-col gap-1">
          <div className="flex items-center">
            <section className="flex items-center gap-4">
              <div className="flex flex-col w-20">
                <p className="text-xs text-muted-foreground">{t("serverDetailChart.upload")}</p>
                <div className="flex items-center gap-1">
                  <span className="relative inline-flex  size-1.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
                  <p className="text-xs font-medium">
                    {up >= 1024 ? `${(up / 1024).toFixed(2)}G/s` : up >= 1 ? `${up.toFixed(2)}M/s` : `${(up * 1024).toFixed(2)}K/s`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col w-20">
                <p className=" text-xs text-muted-foreground">{t("serverDetailChart.download")}</p>
                <div className="flex items-center gap-1">
                  <span className="relative inline-flex  size-1.5 rounded-full bg-[hsl(var(--chart-4))]"></span>
                  <p className="text-xs font-medium">
                    {down >= 1024 ? `${(down / 1024).toFixed(2)}G/s` : down >= 1 ? `${down.toFixed(2)}M/s` : `${(down * 1024).toFixed(2)}K/s`}
                  </p>
                </div>
              </div>
            </section>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
            <LineChart
              accessibilityLayer
              data={networkChartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={200}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatRelativeTime(value)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                mirror={true}
                tickMargin={-15}
                type="number"
                minTickGap={50}
                interval="preserveStartEnd"
                domain={[1, maxDownload]}
                tickFormatter={(value) => `${value.toFixed(0)}M/s`}
              />
              <Line isAnimationActive={false} dataKey="upload" type="linear" stroke="hsl(var(--chart-1))" strokeWidth={1} dot={false} />
              <Line isAnimationActive={false} dataKey="download" type="linear" stroke="hsl(var(--chart-4))" strokeWidth={1} dot={false} />
            </LineChart>
          </ChartContainer>
        </section>
      </CardContent>
    </Card>
  )
}

function ConnectChart({ now, data }: { now: number; data: NezhaServer }) {
  const [connectChartData, setConnectChartData] = useState([] as connectChartData[])

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const { tcp, udp } = formatNezhaInfo(now, data)

  useEffect(() => {
    if (data) {
      const timestamp = Date.now().toString()
      let newData = [] as connectChartData[]
      if (connectChartData.length === 0) {
        newData = [
          { timeStamp: timestamp, tcp: tcp, udp: udp },
          { timeStamp: timestamp, tcp: tcp, udp: udp },
        ]
      } else {
        newData = [...connectChartData, { timeStamp: timestamp, tcp: tcp, udp: udp }]
      }
      if (newData.length > 30) {
        newData.shift()
      }
      setConnectChartData(newData)
    }
  }, [data])

  const chartConfig = {
    tcp: {
      label: "TCP",
    },
    udp: {
      label: "UDP",
    },
  } satisfies ChartConfig

  return (
    <Card
      className={cn({
        "bg-card/70": customBackgroundImage,
      })}
    >
      <CardContent className="px-6 py-3">
        <section className="flex flex-col gap-1">
          <div className="flex items-center">
            <section className="flex items-center gap-4">
              <div className="flex flex-col w-12">
                <p className="text-xs text-muted-foreground">TCP</p>
                <div className="flex items-center gap-1">
                  <span className="relative inline-flex  size-1.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
                  <p className="text-xs font-medium">{tcp}</p>
                </div>
              </div>
              <div className="flex flex-col w-12">
                <p className=" text-xs text-muted-foreground">UDP</p>
                <div className="flex items-center gap-1">
                  <span className="relative inline-flex  size-1.5 rounded-full bg-[hsl(var(--chart-4))]"></span>
                  <p className="text-xs font-medium">{udp}</p>
                </div>
              </div>
            </section>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
            <LineChart
              accessibilityLayer
              data={connectChartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timeStamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={200}
                interval="preserveStartEnd"
                tickFormatter={(value) => formatRelativeTime(value)}
              />
              <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} type="number" interval="preserveStartEnd" />
              <Line isAnimationActive={false} dataKey="tcp" type="linear" stroke="hsl(var(--chart-1))" strokeWidth={1} dot={false} />
              <Line isAnimationActive={false} dataKey="udp" type="linear" stroke="hsl(var(--chart-4))" strokeWidth={1} dot={false} />
            </LineChart>
          </ChartContainer>
        </section>
      </CardContent>
    </Card>
  )
}
