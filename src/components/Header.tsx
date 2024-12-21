import { ModeToggle } from "@/components/ThemeSwitcher"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { fetchLoginUser, fetchSetting } from "@/lib/nezha-api"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { DateTime } from "luxon"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { LanguageSwitcher } from "./LanguageSwitcher"
import { Loader } from "./loading/Loader"
import { Button } from "./ui/button"

function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: settingData, isLoading } = useQuery({
    queryKey: ["setting"],
    queryFn: () => fetchSetting(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const { lastMessage, connected } = useWebSocketContext()

  const onlineCount = connected ? (lastMessage ? JSON.parse(lastMessage.data).online || 0 : 0) : "..."

  const siteName = settingData?.data?.site_name

  // @ts-expect-error CustomLogo is a global variable
  const customLogo = window.CustomLogo || "/apple-touch-icon.png"

  // @ts-expect-error CustomDesc is a global variable
  const customDesc = window.CustomDesc || t("nezha")

  const customBackgroundImage =
    // @ts-expect-error CustomBackgroundImage is a global variable
    (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement("link")
    // @ts-expect-error set link.type
    link.type = "image/x-icon"
    // @ts-expect-error set link.rel
    link.rel = "shortcut icon"
    // @ts-expect-error set link.href
    link.href = customLogo
    document.getElementsByTagName("head")[0].appendChild(link)
  }, [customLogo])

  useEffect(() => {
    document.title = siteName || "哪吒监控 Nezha Monitoring"
  }, [siteName])

  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="flex items-center justify-between header-top">
        <section onClick={() => navigate("/")} className="cursor-pointer flex items-center sm:text-base text-sm font-medium">
          <div className="mr-1 flex flex-row items-center justify-start header-logo">
            <img
              width={40}
              height={40}
              alt="apple-touch-icon"
              src={customLogo}
              className="relative m-0! border-2 border-transparent h-6 w-6 object-cover object-top p-0!"
            />
          </div>
          {isLoading ? <Skeleton className="h-6 w-20 rounded-[5px] bg-muted-foreground/10 animate-none" /> : siteName || "NEZHA"}
          <Separator orientation="vertical" className="mx-2 hidden h-4 w-[1px] md:block" />
          <p className="hidden text-sm font-medium opacity-40 md:block">{customDesc}</p>
        </section>
        <section className="flex items-center gap-2 header-handles">
          <div className="hidden sm:flex items-center gap-2">
            <Links />
            <DashboardLink />
          </div>
          <LanguageSwitcher />
          <ModeToggle />
          <Button
            variant="outline"
            size="sm"
            className={cn("hover:bg-white dark:hover:bg-black cursor-default rounded-full flex items-center px-[9px] bg-white dark:bg-black", {
              "bg-white/70 dark:bg-black/70": customBackgroundImage,
            })}
          >
            {connected ? onlineCount : <Loader visible={true} />}
            <p className="text-muted-foreground">{connected ? t("online") : t("offline")}</p>
            <span
              className={cn("h-2 w-2 rounded-full bg-green-500", {
                "bg-red-500": !connected,
              })}
            ></span>
          </Button>
        </section>
      </section>
      <div className="w-full flex justify-between sm:hidden mt-1">
        <DashboardLink />
        <Links />
      </div>
      <Overview />
    </div>
  )
}

type links = {
  link: string
  name: string
}

function Links() {
  // @ts-expect-error CustomLinks is a global variable
  const customLinks = window.CustomLinks as string

  const links: links[] | null = customLinks ? JSON.parse(customLinks) : null

  if (!links) return null

  return (
    <div className="flex items-center gap-2 w-fit">
      {links.map((link, index) => {
        return (
          <a
            key={index}
            href={link.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium opacity-50 transition-opacity hover:opacity-100"
          >
            {link.name}
          </a>
        )
      })}
    </div>
  )
}

function DashboardLink() {
  const { t } = useTranslation()
  const { data: userData } = useQuery({
    queryKey: ["login-user"],
    queryFn: () => fetchLoginUser(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  return (
    <div className="flex items-center gap-2">
      <a
        href={"/dashboard"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-nowrap gap-1 text-sm font-medium opacity-50 transition-opacity hover:opacity-100"
      >
        {!userData?.data?.id && t("login")}
        {userData?.data?.id && t("dashboard")}
      </a>
    </div>
  )
}

// https://github.com/streamich/react-use/blob/master/src/useInterval.ts
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>(() => {})
  useEffect(() => {
    savedCallback.current = callback
  })
  useEffect(() => {
    if (delay !== null) {
      const interval = setInterval(() => savedCallback.current(), delay || 0)
      return () => clearInterval(interval)
    }
    return undefined
  }, [delay])
}
function Overview() {
  const { t } = useTranslation()
  const [mouted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const timeOption = DateTime.TIME_SIMPLE
  timeOption.hour12 = true
  const [timeString, setTimeString] = useState(DateTime.now().setLocale("en-US").toLocaleString(timeOption))
  useInterval(() => {
    setTimeString(DateTime.now().setLocale("en-US").toLocaleString(timeOption))
  }, 1000)
  return (
    <section className={"mt-10 flex flex-col md:mt-16 header-timer"}>
      <p className="text-base font-semibold">👋 {t("overview")}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium opacity-50">{t("whereTheTimeIs")}</p>
        {mouted ? (
          <p className="text-sm font-medium">{timeString}</p>
        ) : (
          <Skeleton className="h-[20px] w-[50px] rounded-[5px] bg-muted-foreground/10 animate-none"></Skeleton>
        )}
      </div>
    </section>
  )
}
export default Header
