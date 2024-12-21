import { NetworkChart } from "@/components/NetworkChart"
import ServerDetailChart from "@/components/ServerDetailChart"
import ServerDetailOverview from "@/components/ServerDetailOverview"
import TabSwitch from "@/components/TabSwitch"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

export default function ServerDetail() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  const tabs = ["Detail", "Network"]
  const [currentTab, setCurrentTab] = useState(tabs[0])

  const { id: server_id } = useParams()

  if (!server_id) {
    navigate("/404")
    return null
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-0 flex flex-col gap-4 server-info">
      <ServerDetailOverview server_id={server_id} />
      <section className="flex items-center my-2 w-full">
        <Separator className="flex-1" />
        <div className="flex justify-center w-full max-w-[200px]">
          <TabSwitch tabs={tabs} currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </div>
        <Separator className="flex-1" />
      </section>
      <div style={{ display: currentTab === tabs[0] ? "block" : "none" }}>
        <ServerDetailChart server_id={server_id} />
      </div>
      <div style={{ display: currentTab === tabs[1] ? "block" : "none" }}>
        <NetworkChart server_id={Number(server_id)} show={currentTab === tabs[1]} />
      </div>
    </div>
  )
}
