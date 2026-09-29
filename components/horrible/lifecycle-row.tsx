import { Link2, Octagon, Server, Unlink2, type LucideIcon } from "lucide-react";
import type { LifecycleStage } from "@/lib/build-events";

const ICONS: Record<LifecycleStage, LucideIcon> = {
  created: Server,
  attached: Link2,
  detached: Unlink2,
  interrupt: Octagon,
};

export function LifecycleRow({ stage, label }: { stage: LifecycleStage; label: string }) {
  const Icon = ICONS[stage];
  return (
    <div className="flex items-center gap-2 self-start px-1 py-0.5 text-xs text-muted-foreground">
      <Icon className="size-3 shrink-0 text-primary" />
      {label}
    </div>
  );
}
