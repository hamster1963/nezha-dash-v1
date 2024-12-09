import { NezhaWebsocketResponse } from "@/types/nezha-api";
import ServerCard from "@/components/ServerCard";
import { cn, formatNezhaInfo } from "@/lib/utils";
import ServerOverview from "@/components/ServerOverview";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchServerGroup } from "@/lib/nezha-api";
import GroupSwitch from "@/components/GroupSwitch";
import { ServerGroup } from "@/types/nezha-api";
import { useWebSocketContext } from "@/hooks/use-websocket-context";
import { useTranslation } from "react-i18next";
import {
  ChartBarSquareIcon,
  ViewColumnsIcon,
  MapIcon,
} from "@heroicons/react/20/solid";
import { ServiceTracker } from "@/components/ServiceTracker";
import ServerCardInline from "@/components/ServerCardInline";
import { Loader } from "@/components/loading/Loader";
import GlobalMap from "@/components/GlobalMap";
import { useStatus } from "@/hooks/use-status";
import useFilter from "@/hooks/use-filter";

export default function Servers() {
  const { t } = useTranslation();
  const { data: groupData } = useQuery({
    queryKey: ["server-group"],
    queryFn: () => fetchServerGroup(),
  });
  const { lastMessage, connected } = useWebSocketContext();
  const { status } = useStatus();
  const { filter } = useFilter();
  const [showServices, setShowServices] = useState<string>("0");
  const [showMap, setShowMap] = useState<string>("0");
  const [inline, setInline] = useState<string>("0");
  const [currentGroup, setCurrentGroup] = useState<string>("All");

  useEffect(() => {
    const showServicesState = localStorage.getItem("showServices");
    if (showServicesState !== null) {
      setShowServices(showServicesState);
    }
  }, []);

  useEffect(() => {
    const inlineState = localStorage.getItem("inline");
    if (inlineState !== null) {
      setInline(inlineState);
    }
  }, []);

  const groupTabs = [
    "All",
    ...(groupData?.data?.map((item: ServerGroup) => item.group.name) || []),
  ];

  useEffect(() => {
    const hasShownToast = sessionStorage.getItem("websocket-connected-toast");
    if (connected && !hasShownToast) {
      toast.success(t("info.websocketConnected"));
      sessionStorage.setItem("websocket-connected-toast", "true");
    }
  }, [connected]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center min-h-96 justify-center ">
        <div className="font-semibold flex items-center gap-2 text-sm">
          <Loader visible={true} />
          {t("info.websocketConnecting")}
        </div>
      </div>
    );
  }

  const nezhaWsData = lastMessage
    ? (JSON.parse(lastMessage.data) as NezhaWebsocketResponse)
    : null;

  if (!nezhaWsData) {
    return (
      <div className="flex flex-col items-center justify-center ">
        <p className="font-semibold text-sm">{t("info.processing")}</p>
      </div>
    );
  }

  let filteredServers =
    nezhaWsData?.servers?.filter((server) => {
      if (currentGroup === "All") return true;
      const group = groupData?.data?.find(
        (g: ServerGroup) =>
          g.group.name === currentGroup &&
          Array.isArray(g.servers) &&
          g.servers.includes(server.id),
      );
      return !!group;
    }) || [];

  const totalServers = filteredServers.length || 0;
  const onlineServers =
    filteredServers.filter(
      (server) => formatNezhaInfo(nezhaWsData.now, server).online,
    )?.length || 0;
  const offlineServers =
    filteredServers.filter(
      (server) => !formatNezhaInfo(nezhaWsData.now, server).online,
    )?.length || 0;
  const up =
    filteredServers.reduce(
      (total, server) =>
        formatNezhaInfo(nezhaWsData.now, server).online
          ? total + (server.state?.net_out_transfer ?? 0)
          : total,
      0,
    ) || 0;
  const down =
    filteredServers.reduce(
      (total, server) =>
        formatNezhaInfo(nezhaWsData.now, server).online
          ? total + (server.state?.net_in_transfer ?? 0)
          : total,
      0,
    ) || 0;

  const upSpeed =
    filteredServers.reduce(
      (total, server) =>
        formatNezhaInfo(nezhaWsData.now, server).online
          ? total + (server.state?.net_out_speed ?? 0)
          : total,
      0,
    ) || 0;
  const downSpeed =
    filteredServers.reduce(
      (total, server) =>
        formatNezhaInfo(nezhaWsData.now, server).online
          ? total + (server.state?.net_in_speed ?? 0)
          : total,
      0,
    ) || 0;

  filteredServers =
    status === "all"
      ? filteredServers
      : filteredServers.filter((server) =>
          [status].includes(
            formatNezhaInfo(nezhaWsData.now, server).online
              ? "online"
              : "offline",
          ),
        );

  if (filter) {
    filteredServers.sort((a, b) => {
      if (
        !formatNezhaInfo(nezhaWsData.now, a).online &&
        formatNezhaInfo(nezhaWsData.now, b).online
      )
        return 1;
      if (
        formatNezhaInfo(nezhaWsData.now, a).online &&
        !formatNezhaInfo(nezhaWsData.now, b).online
      )
        return -1;
      if (
        !formatNezhaInfo(nezhaWsData.now, a).online &&
        !formatNezhaInfo(nezhaWsData.now, b).online
      )
        return 0;
      return (
        formatNezhaInfo(nezhaWsData.now, b).state.net_in_speed +
        formatNezhaInfo(nezhaWsData.now, b).state.net_out_speed -
        (formatNezhaInfo(nezhaWsData.now, a).state.net_in_speed +
          formatNezhaInfo(nezhaWsData.now, a).state.net_out_speed)
      );
    });
  }

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
      <section className="flex mt-6 items-center gap-2 w-full overflow-hidden">
        <button
          onClick={() => {
            setShowMap(showMap === "0" ? "1" : "0");
          }}
          className={cn(
            "rounded-[50px] text-white cursor-pointer [text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] bg-blue-600  p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]  ",
            {
              "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] bg-blue-500":
                showMap === "1",
            },
          )}
        >
          <MapIcon className="size-[13px]" />
        </button>
        <button
          onClick={() => {
            setShowServices(showServices === "0" ? "1" : "0");
            localStorage.setItem(
              "showServices",
              showServices === "0" ? "1" : "0",
            );
          }}
          className={cn(
            "rounded-[50px] text-white cursor-pointer [text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] bg-blue-600  p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]  ",
            {
              "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] bg-blue-500":
                showServices === "1",
            },
          )}
        >
          <ChartBarSquareIcon className="size-[13px]" />
        </button>
        <button
          onClick={() => {
            setInline(inline === "0" ? "1" : "0");
            localStorage.setItem("inline", inline === "0" ? "1" : "0");
          }}
          className={cn(
            "rounded-[50px] text-white cursor-pointer [text-shadow:_0_1px_0_rgb(0_0_0_/_20%)] bg-blue-600  p-[10px] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]  ",
            {
              "shadow-[inset_0_1px_0_rgba(0,0,0,0.2)] bg-blue-500":
                inline === "1",
            },
          )}
        >
          <ViewColumnsIcon className="size-[13px]" />
        </button>
        <GroupSwitch
          tabs={groupTabs}
          currentTab={currentGroup}
          setCurrentTab={setCurrentGroup}
        />
      </section>
      {showMap === "1" && (
        <GlobalMap
          now={nezhaWsData.now}
          serverList={nezhaWsData?.servers || []}
        />
      )}
      {showServices === "1" && <ServiceTracker />}
      {inline === "1" && (
        <section className="flex flex-col gap-2 overflow-x-scroll scrollbar-hidden mt-6">
          {filteredServers.map((serverInfo) => (
            <ServerCardInline
              now={nezhaWsData.now}
              key={serverInfo.id}
              serverInfo={serverInfo}
            />
          ))}
        </section>
      )}
      {inline === "0" && (
        <section className="grid grid-cols-1 gap-2 md:grid-cols-2 mt-6">
          {filteredServers.map((serverInfo) => (
            <ServerCard
              now={nezhaWsData.now}
              key={serverInfo.id}
              serverInfo={serverInfo}
            />
          ))}
        </section>
      )}
    </div>
  );
}
