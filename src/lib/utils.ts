import { NezhaServer } from "@/types/nezha-api"
import { type ClassValue, clsx } from "clsx"
import dayjs from "dayjs"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNezhaInfo(now: number, serverInfo: NezhaServer) {
  const lastActiveTime = serverInfo.last_active.startsWith("000") ? 0 : parseISOTimestamp(serverInfo.last_active)
  return {
    ...serverInfo,
    cpu: serverInfo.state.cpu || 0,
    gpu: serverInfo.state.gpu || [],
    process: serverInfo.state.process_count || 0,
    up: serverInfo.state.net_out_speed / 1024 / 1024 || 0,
    down: serverInfo.state.net_in_speed / 1024 / 1024 || 0,
    last_active_time_string: lastActiveTime ? new Date(lastActiveTime).toLocaleString() : "",
    online: now - lastActiveTime <= 30000,
    uptime: serverInfo.state.uptime || 0,
    version: serverInfo.host.version || null,
    tcp: serverInfo.state.tcp_conn_count || 0,
    udp: serverInfo.state.udp_conn_count || 0,
    mem: (serverInfo.state.mem_used / serverInfo.host.mem_total) * 100 || 0,
    swap: (serverInfo.state.swap_used / serverInfo.host.swap_total) * 100 || 0,
    disk: (serverInfo.state.disk_used / serverInfo.host.disk_total) * 100 || 0,
    stg: (serverInfo.state.disk_used / serverInfo.host.disk_total) * 100 || 0,
    country_code: serverInfo.country_code,
    platform: serverInfo.host.platform || "",
    net_out_transfer: serverInfo.state.net_out_transfer || 0,
    net_in_transfer: serverInfo.state.net_in_transfer || 0,
    arch: serverInfo.host.arch || "",
    mem_total: serverInfo.host.mem_total || 0,
    swap_total: serverInfo.host.swap_total || 0,
    disk_total: serverInfo.host.disk_total || 0,
    boot_time: serverInfo.host.boot_time || 0,
    platform_version: serverInfo.host.platform_version || "",
    cpu_info: serverInfo.host.cpu || [],
    gpu_info: serverInfo.host.gpu || [],
    load_1: serverInfo.state.load_1?.toFixed(2) || 0.0,
    load_5: serverInfo.state.load_5?.toFixed(2) || 0.0,
    load_15: serverInfo.state.load_15?.toFixed(2) || 0.0,
    public_note: handlePublicNote(serverInfo.id, serverInfo.public_note || ""),
  }
}

export function getDaysBetweenDatesWithAutoRenewal({ autoRenewal, cycle, startDate, endDate }: BillingData): {
  days: number
  cycleLabel: string
  remainingPercentage: number
} {
  let months = 1
  // 套餐资费
  let cycleLabel = cycle

  switch (cycle.toLowerCase()) {
    case "月":
    case "m":
    case "mo":
    case "month":
    case "monthly":
      cycleLabel = "月"
      months = 1
      break
    case "年":
    case "y":
    case "yr":
    case "year":
    case "annual":
      cycleLabel = "年"
      months = 12
      break
    case "季":
    case "q":
    case "qr":
    case "quarterly":
      cycleLabel = "季"
      months = 3
      break
    case "半":
    case "半年":
    case "h":
    case "half":
    case "semi-annually":
      cycleLabel = "半年"
      months = 6
      break
    default:
      cycleLabel = cycle
      break
  }

  const nowTime = new Date().getTime()
  const endTime = dayjs(endDate).valueOf()

  if (autoRenewal !== "1") {
    return {
      days: getDaysBetweenDates(endDate, new Date(nowTime).toISOString()),
      cycleLabel: cycleLabel,
      remainingPercentage:
        getDaysBetweenDates(endDate, new Date(nowTime).toISOString()) / dayjs(endDate).diff(startDate, "day") > 1
          ? 1
          : getDaysBetweenDates(endDate, new Date(nowTime).toISOString()) / dayjs(endDate).diff(startDate, "day"),
    }
  }

  if (nowTime < endTime) {
    return {
      days: getDaysBetweenDates(endDate, new Date(nowTime).toISOString()),
      cycleLabel: cycleLabel,
      remainingPercentage:
        getDaysBetweenDates(endDate, new Date(nowTime).toISOString()) / (30 * months) > 1
          ? 1
          : getDaysBetweenDates(endDate, new Date(nowTime).toISOString()) / (30 * months),
    }
  }

  const nextTime = getNextCycleTime(endTime, months, nowTime)
  const diff = dayjs(nextTime).diff(dayjs(), "day") + 1
  const remainingPercentage = diff / (30 * months) > 1 ? 1 : diff / (30 * months)

  return {
    days: diff,
    cycleLabel: cycleLabel,
    remainingPercentage: remainingPercentage,
  }
}

// Thanks to hi2shark for the code
// https://github.com/hi2shark/nazhua/blob/main/src/utils/date.js#L86
export function getNextCycleTime(startDate: number, months: number, specifiedDate: number): number {
  const start = dayjs(startDate)
  const checkDate = dayjs(specifiedDate)

  if (!start.isValid() || months <= 0) {
    throw new Error("参数无效：请检查起始日期、周期月份数和指定日期。")
  }

  let nextDate = start

  // 循环增加周期直到大于当前日期
  let whileStatus = true
  while (whileStatus) {
    nextDate = nextDate.add(months, "month")
    whileStatus = nextDate.valueOf() <= checkDate.valueOf()
  }

  return nextDate.valueOf() // 返回时间毫秒数
}

export function getDaysBetweenDates(date1: string, date2: string): number {
  const oneDay = 24 * 60 * 60 * 1000 // 一天的毫秒数
  const firstDate = new Date(date1)
  const secondDate = new Date(date2)

  // 计算两个日期之间的天数差异
  return Math.round((firstDate.getTime() - secondDate.getTime()) / oneDay)
}

export const fetcher = (url: string) =>
  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText)
      }
      return res.json()
    })
    .then((data) => data.data)
    .catch((err) => {
      console.error(err)
      throw err
    })

export const nezhaFetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    // @ts-expect-error - res.json() returns a Promise<any>
    error.info = await res.json()
    // @ts-expect-error - res.status is a number
    error.status = res.status
    throw error
  }

  return res.json()
}

export function parseISOTimestamp(isoString: string): number {
  return new Date(isoString).getTime()
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else if (seconds >= 0) {
    return `${seconds}s`
  }
  return "0s"
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

interface BillingData {
  startDate: string
  endDate: string
  autoRenewal: string
  cycle: string
  amount: string
}

interface PlanData {
  bandwidth: string
  trafficVol: string
  trafficType: string
  IPv4: string
  IPv6: string
  networkRoute: string
  extra: string
}

export interface PublicNoteData {
  billingDataMod?: BillingData
  planDataMod?: PlanData
}

export function parsePublicNote(publicNote: string): PublicNoteData | null {
  try {
    if (!publicNote) {
      return null
    }
    const data = JSON.parse(publicNote)
    if (!data.billingDataMod && !data.planDataMod) {
      return null
    }
    if (data.billingDataMod && !data.planDataMod) {
      return {
        billingDataMod: {
          startDate: data.billingDataMod.startDate || "",
          endDate: data.billingDataMod.endDate,
          autoRenewal: data.billingDataMod.autoRenewal || "",
          cycle: data.billingDataMod.cycle || "",
          amount: data.billingDataMod.amount || "",
        },
      }
    }
    if (!data.billingDataMod && data.planDataMod) {
      return {
        planDataMod: {
          bandwidth: data.planDataMod.bandwidth || "",
          trafficVol: data.planDataMod.trafficVol || "",
          trafficType: data.planDataMod.trafficType || "",
          IPv4: data.planDataMod.IPv4 || "",
          IPv6: data.planDataMod.IPv6 || "",
          networkRoute: data.planDataMod.networkRoute || "",
          extra: data.planDataMod.extra || "",
        },
      }
    }

    return {
      billingDataMod: {
        startDate: data.billingDataMod.startDate || "",
        endDate: data.billingDataMod.endDate,
        autoRenewal: data.billingDataMod.autoRenewal || "",
        cycle: data.billingDataMod.cycle || "",
        amount: data.billingDataMod.amount || "",
      },
      planDataMod: {
        bandwidth: data.planDataMod.bandwidth || "",
        trafficVol: data.planDataMod.trafficVol || "",
        trafficType: data.planDataMod.trafficType || "",
        IPv4: data.planDataMod.IPv4 || "",
        IPv6: data.planDataMod.IPv6 || "",
        networkRoute: data.planDataMod.networkRoute || "",
        extra: data.planDataMod.extra || "",
      },
    }
  } catch (error) {
    console.error("Error parsing public note:", error)
    return null
  }
}

// Function to handle public_note with sessionStorage
export function handlePublicNote(serverId: number, publicNote: string): string {
  const storageKey = `server_${serverId}_public_note`
  const storedNote = sessionStorage.getItem(storageKey)

  if (!publicNote && storedNote) {
    return storedNote
  }

  if (publicNote) {
    sessionStorage.setItem(storageKey, publicNote)
    return publicNote
  }

  return ""
}
