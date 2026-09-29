export interface SessionInfo {
  sessionId: string;
  name: string;
  agentKind: string;
  sandboxId: string | null;
  createdAt: string;
}

function formatAgentKind(kind: string): string {
  return kind.replace(/^AGENT_KIND_/, "").toLowerCase() || "unknown";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-[0.8em]" title={value}>
        {value}
      </span>
    </>
  );
}

export function SessionInfoPanel({ sessionId, name, agentKind, sandboxId, createdAt }: SessionInfo) {
  return (
    <div className="border-b border-border px-4 py-3">
      <p className="mb-2 text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
        DigitalOcean Managed Agents
      </p>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <Row label="Name" value={name} />
        <Row label="Session" value={sessionId} />
        <Row label="Harness" value={formatAgentKind(agentKind)} />
        {sandboxId && <Row label="Sandbox" value={sandboxId} />}
        <Row label="Started" value={new Date(createdAt).toLocaleTimeString()} />
      </div>
    </div>
  );
}
