"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame, Octagon, RotateCcw } from "lucide-react";
import type { ClientStatus } from "@/hooks/use-build-session";
import { UpgradeDialog } from "./upgrade-dialog";

interface ActionBarProps {
  status: ClientStatus;
  onMakeItWorse: () => void;
  onStop: () => void;
  onStartOver: () => void;
}

export function ActionBar({ status, onMakeItWorse, onStop, onStartOver }: ActionBarProps) {
  const isRunning = status === "running";
  const canSteer = status === "running" || status === "idle";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
      <Tooltip>
        <TooltipTrigger render={<Button onClick={onMakeItWorse} disabled={!canSteer} />}>
          <Flame className="text-accent" />
          Make it worse
        </TooltipTrigger>
        <TooltipContent>Sends the agent back in to ruin what it just built.</TooltipContent>
      </Tooltip>

      {isRunning && (
        <Tooltip>
          <TooltipTrigger render={<Button variant="destructive" onClick={onStop} />}>
            <Octagon />
            STOP, it&apos;s too ugly
          </TooltipTrigger>
          <TooltipContent>Interrupts the build, then grudgingly tones it down.</TooltipContent>
        </Tooltip>
      )}

      <Button variant="ghost" onClick={onStartOver}>
        <RotateCcw />
        Start over
      </Button>

      <div className="ml-auto">
        <UpgradeDialog />
      </div>
    </div>
  );
}
