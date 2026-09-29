"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BuildEvent } from "@/lib/build-events";
import { ToolCard } from "./tool-card";
import { LifecycleRow } from "./lifecycle-row";
import { SessionInfoPanel, type SessionInfo } from "./session-info";

interface BuildLogProps {
  events: BuildEvent[];
  sessionInfo: SessionInfo | null;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 self-start px-1 py-0.5 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        <span className="size-1 animate-pulse rounded-full bg-primary [animation-delay:0ms]" />
        <span className="size-1 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
        <span className="size-1 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
      </span>
      Thinking…
    </div>
  );
}

export function BuildLog({ events, sessionInfo }: BuildLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  const visible = events.filter((event) => event.kind !== "status");
  const last = visible[visible.length - 1];
  const isWaiting = last?.kind === "lifecycle" && last.stage === "attached";

  return (
    <div className="flex h-full flex-col">
      {sessionInfo && <SessionInfoPanel {...sessionInfo} />}
      <ScrollArea className="h-full flex-1">
        <div className="flex flex-col gap-2.5 p-4">
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Waking up the world&apos;s worst web designer…
            </p>
          )}
          {visible.map((event) =>
            event.kind === "lifecycle" ? (
              <LifecycleRow key={event.id} stage={event.stage} label={event.label} />
            ) : (
              <ToolCard key={event.id} name={event.name} summary={event.summary} />
            ),
          )}
          {isWaiting && <ThinkingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
