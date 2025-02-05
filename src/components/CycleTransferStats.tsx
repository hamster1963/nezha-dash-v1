import { CycleTransferStats, NezhaServer } from "@/types/nezha-api"
import React from "react"

import { CycleTransferStatsClient } from "./CycleTransferStatsClient"

interface CycleTransferStatsProps {
  serverList: NezhaServer[]
  cycleStats: CycleTransferStats
  className?: string
}

export const CycleTransferStatsCard: React.FC<CycleTransferStatsProps> = ({ serverList, cycleStats, className }) => {
  if (serverList.length === 0) {
    return null
  }

  const serverIdList = serverList.map((server) => server.id.toString())

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Object.entries(cycleStats).map(([cycleId, cycleData]) => {
        if (!cycleData.server_name) {
          return null
        }

        return Object.entries(cycleData.server_name).map(([serverId, serverName]) => {
          const transfer = cycleData.transfer?.[serverId] || 0
          const nextUpdate = cycleData.next_update?.[serverId]

          if (!serverIdList.includes(serverId)) {
            return null
          }

          if (!transfer && !nextUpdate) {
            return null
          }

          return (
            <CycleTransferStatsClient
              key={`${cycleId}-${serverId}`}
              name={cycleData.name}
              from={cycleData.from}
              to={cycleData.to}
              max={cycleData.max}
              serverStats={[
                {
                  serverId,
                  serverName,
                  transfer,
                  nextUpdate: nextUpdate || "",
                },
              ]}
              className={className}
            />
          )
        })
      })}
    </section>
  )
}

export default CycleTransferStatsCard
