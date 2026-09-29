import { execFile, spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DOCTL_BIN = process.env.DOCTL_BIN || "doctl";

// Auth: `doctl` reads DIGITALOCEAN_ACCESS_TOKEN from the environment itself
// (child processes inherit it), so the token is never put on the command line
// where other local users could see it in `ps`.

export class DoctlError extends Error {
  constructor(
    message: string,
    public readonly stderr: string,
  ) {
    super(message);
    this.name = "DoctlError";
  }
}

function stderrOf(err: unknown): string {
  if (typeof err === "object" && err !== null && "stderr" in err) {
    const value = (err as { stderr?: unknown }).stderr;
    if (typeof value === "string") return value;
  }
  return "";
}

async function runDoctl(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync(DOCTL_BIN, args, {
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    const stderr = stderrOf(err);
    throw new DoctlError(stderr.trim() || (err instanceof Error ? err.message : "doctl command failed"), stderr);
  }
}

async function runDoctlJson<T>(args: string[]): Promise<T> {
  const stdout = await runDoctl([...args, "-o", "json"]);
  return JSON.parse(stdout) as T;
}

export interface DoSession {
  session_id: string;
  name: string;
  agent_kind: string;
  status: string;
  created_at: string;
  last_event_at?: string;
  sandbox_id?: string;
  config_id?: string;
}

export interface DoPromptResult {
  session_id: string;
  run_id: string;
  text: string;
  status: string;
  total_tokens_in?: number;
  total_tokens_out?: number;
}

export async function createSession(name: string): Promise<DoSession> {
  return runDoctlJson<DoSession>(["harness-runtime", "create", "--harness", "opencode", "--name", name]);
}

/** Reads a small text file from a session's /workspace. Throws DoctlError if missing. */
export async function catWorkspaceFile(session: string, path: string): Promise<string> {
  return runDoctl(["harness-runtime", "files", "cat", "--", session, path]);
}

/**
 * Spawns `doctl harness-runtime prompt` against an existing session. The
 * caller is responsible for reading stdout (final JSON result) and stderr
 * (live "· tool" progress lines) as the child runs.
 */
export function spawnPrompt(session: string, text: string): ChildProcessByStdio<null, Readable, Readable> {
  return spawn(
    // turbopackIgnore: true
    DOCTL_BIN,
    ["harness-runtime", "prompt", "-o", "json", "--on-hitl", "approve", "--", session, text],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
}
