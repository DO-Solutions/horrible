import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/hooks/use-build-session";

const STYLES: Record<ClientStatus, { label: string; className: string; pulse?: boolean }> = {
  connecting: {
    label: "Connecting",
    className: "border-border text-muted-foreground",
  },
  running: {
    label: "Running",
    className: "border-primary/40 bg-primary/10 text-primary",
    pulse: true,
  },
  idle: {
    label: "Idle",
    className: "border-border bg-secondary text-secondary-foreground",
  },
  interrupted: {
    label: "Interrupted",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  terminated: {
    label: "Done",
    className: "border-accent/40 bg-accent/10 text-accent",
  },
  error: {
    label: "Error",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  const style = STYLES[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5", style.className)}>
      {style.pulse && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
      )}
      {style.label}
    </Badge>
  );
}
