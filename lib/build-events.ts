export type BuildStatus = "running" | "idle" | "terminated" | "error";

export type LifecycleStage = "created" | "attached" | "detached" | "interrupt";

export type BuildEvent =
  | { kind: "tool"; id: string; name: string; summary: string }
  | { kind: "lifecycle"; id: string; stage: LifecycleStage; label: string }
  | { kind: "status"; id: string; status: BuildStatus; detail?: string };

const BULLET_PREFIX = /^[·*-]\s*/;
const RUN_STARTED = /^run\s+\S+\s+started$/i;
const BARE_DURATION = /^\d+(\.\d+)?(ms|s|m)$/i;
const CD_PREFIX = /^cd\s+\S+\s*&&\s*/i;

/** Human labels for the built-in file tools when the line carries no extra detail (just the bare verb). */
const BARE_TOOL_LABELS: Record<string, string> = {
  write: "Writing a file",
  read: "Reading a file",
  edit: "Editing a file",
  glob: "Searching for files",
  grep: "Searching file contents",
};

function truncate(value: string, max: number): string {
  const singleLine = value.replace(/\s+/g, " ").trim();
  return singleLine.length > max ? `${singleLine.slice(0, max - 1)}…` : singleLine;
}

/**
 * `doctl harness-runtime prompt` streams one "· <activity>" line per tool
 * call to stderr - either a bare verb ("· write") or, for shell commands,
 * the command itself ("· cd /workspace && rg -c ... index.html"), plus a
 * "· run <id> started" marker and occasional bare elapsed-time heartbeats
 * ("1s") for a still-running call. Returns null for the latter two; for a
 * real tool call, strips the boilerplate "cd <dir> &&" prefix shells add and
 * caps the summary length so a long inline script doesn't blow up the log.
 */
export function parseProgressLine(rawLine: string): { name: string; summary: string } | null {
  let line = rawLine.replace(BULLET_PREFIX, "").trim();
  if (!line || RUN_STARTED.test(line) || BARE_DURATION.test(line)) return null;

  line = line.replace(CD_PREFIX, "");
  const name = line.split(/\s+/, 1)[0] ?? line;

  if (line === name && BARE_TOOL_LABELS[name]) {
    return { name, summary: BARE_TOOL_LABELS[name] };
  }

  return { name, summary: truncate(line, 70) };
}
