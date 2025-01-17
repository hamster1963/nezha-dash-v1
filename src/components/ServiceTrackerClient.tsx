import { cn } from "@/lib/utils"
import React from "react"
import { useTranslation } from "react-i18next"

import { Separator } from "./ui/separator"

interface ServiceTrackerProps {
  days: Array<{
    completed: boolean
    date?: Date
  }>
  className?: string
  title?: string
  uptime?: number
  avgDelay?: number
}

export const ServiceTrackerClient: React.FC<ServiceTrackerProps> = ({ days, className, title, uptime = 100, avgDelay = 0 }) => {
  const { t } = useTranslation()
  const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined
  return (
    <div
      className={cn(
        "w-full space-y-3 bg-white px-4 py-4  rounded-lg border bg-card text-card-foreground shadow-lg shadow-neutral-200/40 dark:shadow-none",
        className,
        {
          "bg-card/70": customBackgroundImage,
        },
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white dark:bg-black" />
          </div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-600 dark:text-stone-400 font-medium text-sm">{avgDelay.toFixed(0)}ms</span>
          <Separator className="h-4 mx-0" orientation="vertical" />
          <span className="text-green-600 font-medium text-sm">
            {uptime.toFixed(1)}% {t("serviceTracker.uptime")}
          </span>
        </div>
      </div>

      <div className="flex gap-[2px]">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn("flex-1 h-6 rounded-[5px] transition-colors", day.completed ? "bg-green-600" : "bg-red-500/60")}
            title={day.date ? day.date.toLocaleDateString() : `Day ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>30 {t("serviceTracker.daysAgo")}</span>
        <span>{t("serviceTracker.today")}</span>
      </div>
    </div>
  )
}

export default ServiceTrackerClient
