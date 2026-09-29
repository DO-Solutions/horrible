"use client";

import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { BuildEvent } from "@/lib/build-events";
import type { ClientStatus } from "@/hooks/use-build-session";
import { BuildLog } from "./build-log";
import { PreviewPane } from "./preview-pane";
import { ActionBar } from "./action-bar";
import { StatusBadge } from "./status-badge";
import type { SessionInfo } from "./session-info";
import { cn } from "@/lib/utils";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

interface BuildViewProps {
  events: BuildEvent[];
  sessionInfo: SessionInfo | null;
  status: ClientStatus;
  siteHtml: string | null;
  onMakeItWorse: () => void;
  onStop: () => void;
  onStartOver: () => void;
}

export function BuildView({
  events,
  sessionInfo,
  status,
  siteHtml,
  onMakeItWorse,
  onStop,
  onStartOver,
}: BuildViewProps) {
  const isMobile = useIsMobile();

  return (
    <div className="grid flex-1 grid-rows-[auto_1fr_auto] overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold tracking-tight">horrible</span>
        <StatusBadge status={status} />
      </div>

      <div className="min-h-0 overflow-hidden">
        <ResizablePanelGroup orientation={isMobile ? "vertical" : "horizontal"}>
          <ResizablePanel
            defaultSize={40}
            minSize={25}
            className={cn(
              "flex h-full min-h-0 flex-col border-border",
              isMobile ? "border-b" : "border-r",
            )}
          >
            <BuildLog events={events} sessionInfo={sessionInfo} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={30} className="flex h-full min-h-0 flex-col">
            <PreviewPane html={siteHtml} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ActionBar
        status={status}
        onMakeItWorse={onMakeItWorse}
        onStop={onStop}
        onStartOver={onStartOver}
      />
    </div>
  );
}
