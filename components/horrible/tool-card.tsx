import {
  FileEdit,
  FilePlus,
  FileSearch,
  Globe,
  Search,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  write: FilePlus,
  edit: FileEdit,
  read: FileSearch,
  bash: Terminal,
  glob: Search,
  grep: Search,
  web_fetch: Globe,
  web_search: Globe,
};

export function ToolCard({ name, summary }: { name: string; summary: string }) {
  const Icon = ICONS[name] ?? Wrench;
  return (
    <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-secondary-foreground">
      <Icon className="size-3.5 shrink-0 text-primary" />
      <span className="shrink-0 font-mono text-[0.75rem] text-muted-foreground">{name}</span>
      <span className="truncate">{summary}</span>
    </div>
  );
}
