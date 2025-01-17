import { formatBytes } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CircleStackIcon } from "@heroicons/react/24/outline"
import React from "react"
import { useTranslation } from "react-i18next"

import AnimatedCircularProgressBar from "./ui/animated-circular-progress-bar"

interface CycleTransferStatsClientProps {
  name: string
  from: string
  to: string
  max: number
  serverStats: Array<{
    serverId: string
    serverName: string
    transfer: number
    nextUpdate: string
  }>
  className?: string
}

export const CycleTransferStatsClient: React.FC<CycleTransferStatsClientProps> = ({ name, from, to, max, serverStats, className }) => {
  const { t } = useTranslation()
  const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined
  return (
    <div
      className={cn(
        "w-full bg-white px-4 py-3 rounded-lg border bg-card text-card-foreground shadow-lg shadow-neutral-200/40 dark:shadow-none space-y-2",
        className,
        {
          "bg-card/70": customBackgroundImage,
        },
      )}
    >
      {serverStats.map(({ serverId, serverName, transfer, nextUpdate }) => {
        const progress = (transfer / max) * 100

        return (
          <div key={serverId}>
            <section className="flex justify-between items-center">
              <div className="bg-green-600 w-fit text-white px-1.5 py-0.5 rounded-full text-[10px]">{name}</div>
              <span className="text-stone-600 dark:text-stone-400 text-xs">
                {new Date(from).toLocaleDateString()} - {new Date(to).toLocaleDateString()}
              </span>
            </section>

            <section className="flex justify-between items-center mt-2">
              <div className="flex gap-1 items-center">
                <CircleStackIcon className="size-3 text-neutral-400 dark:text-neutral-600" />
                <span className="text-sm font-semibold">{serverName}</span>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-xs text-end w-10 font-medium">{progress.toFixed(0)}%</p>
                <AnimatedCircularProgressBar className="size-4 text-[0px]" max={100} min={0} value={progress} primaryColor="hsl(var(--chart-5))" />
              </div>
            </section>

            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden h-2.5 mt-2">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>

            <section className="flex justify-between items-center mt-2">
              <span className="text-[13px] text-stone-800 dark:text-stone-400 font-medium">
                {formatBytes(transfer)} {t("cycleTransfer.used")}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-normal">
                {formatBytes(max)} {t("cycleTransfer.total")}
              </span>
            </section>

            <section className="flex justify-between items-center mt-2">
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {t("cycleTransfer.nextUpdate")}: {new Date(nextUpdate).toLocaleString()}
              </div>
            </section>
          </div>
        )
      })}
    </div>
  )
}

export default CycleTransferStatsClient
