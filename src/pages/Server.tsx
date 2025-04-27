import GlobalMap from "@/components/GlobalMap"
import GroupSwitch from "@/components/GroupSwitch"
import ServerCard from "@/components/ServerCard"
import ServerCardInline from "@/components/ServerCardInline"
import ServerOverview from "@/components/ServerOverview"
import { ServiceTracker } from "@/components/ServiceTracker"
import { Loader } from "@/components/loading/Loader"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SORT_ORDERS, SORT_TYPES } from "@/context/sort-context"
import { useSort } from "@/hooks/use-sort"
import { useStatus } from "@/hooks/use-status"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { fetchServerGroup } from "@/lib/nezha-api"
import { cn, formatNezhaInfo } from "@/lib/utils"
import { NezhaWebsocketResponse } from "@/types/nezha-api"
import { ServerGroup } from "@/types/nezha-api"
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon, ChartBarSquareIcon, MapIcon, ViewColumnsIcon } from "@heroicons/react/20/solid"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

export default function Servers() {
  const { t } = useTranslation()
  const { sortType, sortOrder, setSortOrder, setSortType } = useSort()
  const { data: groupData } = useQuery({
    queryKey: ["server-group"],
    queryFn: () => fetchServerGroup(),
  })
  const { lastMessage, connected } = useWebSocketContext()
  const { status } = useStatus()
  const [showServices, setShowServices] = useState<string>("0")
  const [showMap, setShowMap] = useState<string>("0")
  const [inline, setInline] = useState<string>("0")
  const containerRef = useRef<HTMLDivElement>(null)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const [currentGroup, setCurrentGroup] = useState<string>("All")

  const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem("scrollPosition")
    if (savedPosition && containerRef.current) {
      containerRef.current.scrollTop = Number(savedPosition)
    }
  }

  const handleTagChange = (newGroup: string) => {
    setCurrentGroup(newGroup)
    sessionStorage.setItem("selectedGroup", newGroup)
    sessionStorage.setItem("scrollPosition", String(containerRef.current?.scrollTop || 0))
  }

  useEffect(() => {
    const showServicesState = localStorage.getItem("showServices")
    if (window.ForceShowServices) {
      setShowServices("1")
    } else if (showServicesState !== null) {
      setShowServices(showServicesState)
    }
  }, [])

  useEffect(() => {
    const checkInlineSettings = () => {
      const isMobile = window.innerWidth < 768

      if (!isMobile) {
        const inlineState = localStorage.getItem("inline")
        if (window.ForceCardInline) {
          setInline("1")
        } else if (inlineState !== null) {
          setInline(inlineState)
        }
      }
    }

    checkInlineSettings()

    window.addEventListener("resize", checkInlineSettings)

    return () => {
      window.removeEventListener("resize", checkInlineSettings)
    }
  }, [])

  useEffect(() => {
    const showMapState = localStorage.getItem("showMap")
    if (window.ForceShowMap) {
      setShowMap("1")
    } else if (showMapState !== null) {
      setShowMap(showMapState)
    }
  }, [])

  useEffect(() => {
    const savedGroup = sessionStorage.getItem("selectedGroup") || "All"
    setCurrentGroup(savedGroup)

    restoreScrollPosition()
  }, [])

  const nezhaWsData = lastMessage ? (JSON.parse(lastMessage.data) as NezhaWebsocketResponse) : null

  const groupTabs = [
    "All",
    ...(groupData?.data
      ?.filter((item: ServerGroup) => {
        return Array.isArray(item.servers) && item.servers.some((serverId) => nezhaWsData?.servers?.some((server) => server.id === serverId))
      })
      ?.map((item: ServerGroup) => item.group.name) || []),
  ]

  if (!connected && !lastMessage) {
    return (
      <div className="flex flex-col items-center min-h-96 justify-center ">
        <div className="font-semibold flex items-center gap-2 text-sm">
          <Loader visible={true} />
          {t("info.websocketConnecting")}
        </div>
      </div>
    )
  }

  if (!nezhaWsData) {
    return (
      <div className="flex flex-col items-center justify-center ">
        <p className="font-semibold text-sm">{t("info.processing")}</p>
      </div>
    )
  }

  let filteredServers =
    nezhaWsData?.servers?.filter((server) => {
      if (currentGroup === "All") return true
      const group = groupData?.data?.find(
        (g: ServerGroup) => g.group.name === currentGroup && Array.isArray(g.servers) && g.servers.includes(server.id),
      )
      return !!group
    }) || []

  const totalServers = filteredServers.length || 0
  const onlineServers = filteredServers.filter((server) => formatNezhaInfo(nezhaWsData.now, server).online)?.length || 0
  const offlineServers = filteredServers.filter((server) => !formatNezhaInfo(nezhaWsData.now, server).online)?.length || 0
  const up =
    filteredServers.reduce(
      (total, server) => (formatNezhaInfo(nezhaWsData.now, server).online ? total + (server.state?.net_out_transfer ?? 0) : total),
      0,
    ) || 0
  const down =
    filteredServers.reduce(
      (total, server) => (formatNezhaInfo(nezhaWsData.now, server).online ? total + (server.state?.net_in_transfer ?? 0) : total),
      0,
    ) || 0

  const upSpeed =
    filteredServers.reduce(
      (total, server) => (formatNezhaInfo(nezhaWsData.now, server).online ? total + (server.state?.net_out_speed ?? 0) : total),
      0,
    ) || 0
  const downSpeed =
    filteredServers.reduce(
      (total, server) => (formatNezhaInfo(nezhaWsData.now, server).online ? total + (server.state?.net_in_speed ?? 0) : total),
      0,
    ) || 0

  filteredServers =
    status === "all"
      ? filteredServers
      : filteredServers.filter((server) => [status].includes(formatNezhaInfo(nezhaWsData.now, server).online ? "online" : "offline"))

  filteredServers = filteredServers.sort((a, b) => {
    const serverAInfo = formatNezhaInfo(nezhaWsData.now, a)
    const serverBInfo = formatNezhaInfo(nezhaWsData.now, b)

    if (sortType !== "name") {
      // 仅在非 "name" 排序时，先按在线状态排序
      if (!serverAInfo.online && serverBInfo.online) return 1
      if (serverAInfo.online && !serverBInfo.online) return -1
      if (!serverAInfo.online && !serverBInfo.online) {
        // 如果两者都离线，可以继续按照其他条件排序，或者保持原序
        // 这里选择保持原序
        return 0
      }
    }

    let comparison = 0

    switch (sortType) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "uptime":
        comparison = (a.state?.uptime ?? 0) - (b.state?.uptime ?? 0)
        break
      case "system":
        comparison = a.host.platform.localeCompare(b.host.platform)
        break
      case "cpu":
        comparison = (a.state?.cpu ?? 0) - (b.state?.cpu ?? 0)
        break
      case "mem":
        comparison = (formatNezhaInfo(nezhaWsData.now, a).mem ?? 0) - (formatNezhaInfo(nezhaWsData.now, b).mem ?? 0)
        break
      case "disk":
        comparison = (formatNezhaInfo(nezhaWsData.now, a).disk ?? 0) - (formatNezhaInfo(nezhaWsData.now, b).disk ?? 0)
        break
      case "up":
        comparison = (a.state?.net_out_speed ?? 0) - (b.state?.net_out_speed ?? 0)
        break
      case "down":
        comparison = (a.state?.net_in_speed ?? 0) - (b.state?.net_in_speed ?? 0)
        break
      case "up total":
        comparison = (a.state?.net_out_transfer ?? 0) - (b.state?.net_out_transfer ?? 0)
        break
      case "down total":
        comparison = (a.state?.net_in_transfer ?? 0) - (b.state?.net_in_transfer ?? 0)
        break
      default:
        comparison = 0
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  return (
    <div className="mx-auto w-full max-w-5xl px-0">
      <ServerOverview
        total={totalServers}
        online={onlineServers}
        offline={offlineServers}
        up={up}
        down={down}
        upSpeed={upSpeed}
        downSpeed={downSpeed}
      />
      <div className="flex mt-6 items-center justify-between gap-2 server-overview-controls">
        <section className="flex items-center gap-2 w-full overflow-hidden">
          <button
            onClick={() => {
              setShowMap(showMap === "0" ? "1" : "0")
              localStorage.setItem("showMap", showMap === "0" ? "1" : "0")
            }}
            className={cn(
              "rounded-[50px] bg-white dark:bg-stone-800 cursor-pointer p-[10px] transition-all border dark:border-none border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
              {
                "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] !bg-blue-600 hover:!bg-blue-600 border-blue-600 dark:border-blue-600": showMap === "1",
                "text-white": showMap === "1",
              },
              {
                "bg-opacity-70 dark:bg-opacity-70": customBackgroundImage,
              },
            )}
          >
            <MapIcon
              className={cn("size-[13px]", {
                "text-white": showMap === "1",
              })}
            />
          </button>
          <button
            onClick={() => {
              setShowServices(showServices === "0" ? "1" : "0")
              localStorage.setItem("showServices", showServices === "0" ? "1" : "0")
            }}
            className={cn(
              "rounded-[50px] bg-white dark:bg-stone-800 cursor-pointer p-[10px] transition-all border dark:border-none border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
              {
                "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] !bg-blue-600 hover:!bg-blue-600 border-blue-600 dark:border-blue-600": showServices === "1",
                "text-white": showServices === "1",
              },
              {
                "bg-opacity-70 dark:bg-opacity-70": customBackgroundImage,
              },
            )}
          >
            <ChartBarSquareIcon
              className={cn("size-[13px]", {
                "text-white": showServices === "1",
              })}
            />
          </button>
          <button
            onClick={() => {
              setInline(inline === "0" ? "1" : "0")
              localStorage.setItem("inline", inline === "0" ? "1" : "0")
            }}
            className={cn(
              "rounded-[50px] bg-white dark:bg-stone-800 cursor-pointer p-[10px] transition-all border dark:border-none border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
              {
                "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] !bg-blue-600 hover:!bg-blue-600 border-blue-600 dark:border-blue-600": inline === "1",
                "text-white": inline === "1",
              },
              {
                "bg-opacity-70 dark:bg-opacity-70": customBackgroundImage,
              },
            )}
          >
            <ViewColumnsIcon
              className={cn("size-[13px]", {
                "text-white": inline === "1",
              })}
            />
          </button>
          <GroupSwitch tabs={groupTabs} currentTab={currentGroup} setCurrentTab={handleTagChange} />
        </section>
        <Popover onOpenChange={setSettingsOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "rounded-[50px] flex items-center gap-1 dark:text-white border dark:border-none text-black cursor-pointer dark:[text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] dark:bg-stone-800 bg-white  p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]  ",
                {
                  "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] dark:bg-stone-700 bg-stone-200": settingsOpen,
                },
                {
                  "dark:bg-stone-800/70 bg-stone-100/70 ": customBackgroundImage,
                },
              )}
            >
              <p className="text-[10px] font-bold whitespace-nowrap">{sortType === "default" ? "Sort" : sortType.toUpperCase()}</p>
              {sortOrder === "asc" && sortType !== "default" ? (
                <ArrowUpIcon className="size-[13px]" />
              ) : sortOrder === "desc" && sortType !== "default" ? (
                <ArrowDownIcon className="size-[13px]" />
              ) : (
                <ArrowsUpDownIcon className="size-[13px]" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-4 w-[240px] rounded-lg">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Sort by</Label>
                <Select value={sortType} onValueChange={setSortType}>
                  <SelectTrigger className="w-full text-xs h-8">
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Sort order</Label>
                <Select value={sortOrder} onValueChange={setSortOrder} disabled={sortType === "default"}>
                  <SelectTrigger className="w-full text-xs h-8">
                    <SelectValue placeholder="Choose order" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_ORDERS.map((order) => (
                      <SelectItem key={order} value={order} className="text-xs">
                        {order.charAt(0).toUpperCase() + order.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {showMap === "1" && <GlobalMap now={nezhaWsData.now} serverList={nezhaWsData?.servers || []} />}
      {showServices === "1" && <ServiceTracker serverList={filteredServers} />}
      {inline === "1" && (
        <section ref={containerRef} className="flex flex-col gap-2 overflow-x-scroll scrollbar-hidden mt-6 server-inline-list">
          {filteredServers.map((serverInfo) => (
            <ServerCardInline now={nezhaWsData.now} key={serverInfo.id} serverInfo={serverInfo} />
          ))}
        </section>
      )}
      {inline === "0" && (
        <section ref={containerRef} className="grid grid-cols-1 gap-2 md:grid-cols-2 mt-6 server-card-list">
          {filteredServers.map((serverInfo) => (
            <ServerCard now={nezhaWsData.now} key={serverInfo.id} serverInfo={serverInfo} />
          ))}
        </section>
      )}
    </div>
  )
}
