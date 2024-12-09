import ServerFlag from "@/components/ServerFlag";
import ServerUsageBar from "@/components/ServerUsageBar";

import {
  cn,
  formatNezhaInfo,
  parsePublicNote,
  getDaysBetweenDates,
} from "@/lib/utils";
import { NezhaServer } from "@/types/nezha-api";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";
import { formatBytes } from "@/lib/format";

export default function ServerCard({
  now,
  serverInfo,
}: {
  now: number;
  serverInfo: NezhaServer;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    name,
    country_code,
    online,
    cpu,
    up,
    down,
    mem,
    stg,
    net_in_transfer,
    net_out_transfer,
    public_note,
  } = formatNezhaInfo(now, serverInfo);

  const showFlag = true;

  const parsedData = parsePublicNote(public_note);

  let daysLeft = 0;
  let isNeverExpire = false;

  if (parsedData?.billingDataMod?.endDate) {
    if (parsedData.billingDataMod.endDate.startsWith("0000-00-00")) {
      isNeverExpire = true;
    } else {
      daysLeft = getDaysBetweenDates(
        parsedData.billingDataMod.endDate,
        new Date(now).toISOString(),
      );
    }
  }

  return online ? (
    <section>
      <Card
        className={cn(
          "flex flex-col items-center justify-start gap-3 p-3 md:px-5 lg:flex-row cursor-pointer hover:bg-accent/50 transition-colors",
        )}
        onClick={() => navigate(`/server/${serverInfo.id}`)}
      >
        <section
          className={cn("grid items-center gap-2 lg:w-40")}
          style={{ gridTemplateColumns: "auto auto 1fr" }}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 self-center"></span>
          <div
            className={cn(
              "flex items-center justify-center",
              showFlag ? "min-w-[17px]" : "min-w-0",
            )}
          >
            {showFlag ? <ServerFlag country_code={country_code} /> : null}
          </div>
          <div className="relative flex flex-col">
            <p
              className={cn(
                "break-all font-bold tracking-tight",
                showFlag ? "text-xs " : "text-sm",
              )}
            >
              {name}
            </p>
            {parsedData &&
              (daysLeft >= 0 ? (
                <p className={cn("text-[10px] text-muted-foreground")}>
                  剩余时间: {isNeverExpire ? "永久" : daysLeft + "天"}
                </p>
              ) : (
                <p
                  className={cn(
                    "text-[10px] text-muted-foreground text-red-600",
                  )}
                >
                  已过期: {daysLeft * -1} 天
                </p>
              ))}
          </div>
        </section>
        <div className="flex flex-col gap-2">
          <section className={cn("grid grid-cols-5 items-center gap-3")}>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">{"CPU"}</p>
              <div className="flex items-center text-xs font-semibold">
                {cpu.toFixed(2)}%
              </div>
              <ServerUsageBar value={cpu} />
            </div>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">
                {t("serverCard.mem")}
              </p>
              <div className="flex items-center text-xs font-semibold">
                {mem.toFixed(2)}%
              </div>
              <ServerUsageBar value={mem} />
            </div>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">
                {t("serverCard.stg")}
              </p>
              <div className="flex items-center text-xs font-semibold">
                {stg.toFixed(2)}%
              </div>
              <ServerUsageBar value={stg} />
            </div>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">
                {t("serverCard.upload")}
              </p>
              <div className="flex items-center text-xs font-semibold">
                {up >= 1024
                  ? `${(up / 1024).toFixed(2)}G/s`
                  : `${up.toFixed(2)}M/s`}
              </div>
            </div>
            <div className={"flex w-14 flex-col"}>
              <p className="text-xs text-muted-foreground">
                {t("serverCard.download")}
              </p>
              <div className="flex items-center text-xs font-semibold">
                {down >= 1024
                  ? `${(down / 1024).toFixed(2)}G/s`
                  : `${down.toFixed(2)}M/s`}
              </div>
            </div>
          </section>
          <section className={"flex items-center justify-between gap-1"}>
            <Badge
              variant="secondary"
              className="items-center flex-1 justify-center rounded-[8px] text-nowrap text-[11px] border-muted-50 shadow-md shadow-neutral-200/30 dark:shadow-none"
            >
              {t("serverCard.upload")}:{formatBytes(net_out_transfer)}
            </Badge>
            <Badge
              variant="outline"
              className="items-center flex-1 justify-center rounded-[8px] text-nowrap text-[11px] shadow-md shadow-neutral-200/30 dark:shadow-none"
            >
              {t("serverCard.download")}:{formatBytes(net_in_transfer)}
            </Badge>
          </section>
        </div>
      </Card>
    </section>
  ) : (
    <Card
      className={cn(
        "flex flex-col lg:min-h-[91px] min-h-[123px] items-center justify-start gap-3 p-3 md:px-5 lg:flex-row cursor-pointer hover:bg-accent/50 transition-colors",
      )}
      onClick={() => navigate(`/server/${serverInfo.id}`, { replace: true })}
    >
      <section
        className={cn("grid items-center gap-2 lg:w-40")}
        style={{ gridTemplateColumns: "auto auto 1fr" }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 self-center"></span>
        <div
          className={cn(
            "flex items-center justify-center",
            showFlag ? "min-w-[17px]" : "min-w-0",
          )}
        >
          {showFlag ? <ServerFlag country_code={country_code} /> : null}
        </div>
        <div className="relative">
          <p
            className={cn(
              "break-all font-bold tracking-tight",
              showFlag ? "text-xs" : "text-sm",
            )}
          >
            {name}
          </p>
        </div>
      </section>
    </Card>
  );
}
