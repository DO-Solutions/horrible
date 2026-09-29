import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { spawnPrompt } from "./doctl";
import { parseProgressLine, type BuildEvent } from "./build-events";

interface SessionRuntime {
  events: BuildEvent[];
  emitter: EventEmitter;
  queue: string[];
  current: ChildProcessByStdio<null, Readable, Readable> | null;
  interruptRequested: boolean;
}

declare global {
  var __horribleRuntimes: Map<string, SessionRuntime> | undefined;
}

const runtimes = globalThis.__horribleRuntimes ?? (globalThis.__horribleRuntimes = new Map());

function emit(runtime: SessionRuntime, event: BuildEvent): void {
  runtime.events.push(event);
  runtime.emitter.emit("event", event);
}

export function registerSession(sessionId: string): void {
  const runtime: SessionRuntime = {
    events: [],
    emitter: new EventEmitter(),
    queue: [],
    current: null,
    interruptRequested: false,
  };
  runtimes.set(sessionId, runtime);
  emit(runtime, {
    kind: "lifecycle",
    id: randomUUID(),
    stage: "created",
    label: "Session created",
  });
}

/** Full history so far, or null if the session is unknown to this server process. */
export function getSessionEvents(sessionId: string): BuildEvent[] | null {
  return runtimes.get(sessionId)?.events ?? null;
}

/** Returns an unsubscribe function, or null if the session is unknown. */
export function subscribeSession(
  sessionId: string,
  onEvent: (event: BuildEvent) => void,
): (() => void) | null {
  const runtime = runtimes.get(sessionId);
  if (!runtime) return null;
  runtime.emitter.on("event", onEvent);
  return () => runtime.emitter.off("event", onEvent);
}

/** Queues a prompt; kicks off immediately if nothing is currently running. Returns false for an unknown session. */
export function enqueuePrompt(sessionId: string, text: string): boolean {
  const runtime = runtimes.get(sessionId);
  if (!runtime) return false;

  runtime.queue.push(text);
  if (!runtime.current) {
    void runNext(sessionId);
  }
  return true;
}

/** Best-effort: kills the local doctl process watching the current turn. The remote run may continue briefly regardless. */
export function interruptSession(sessionId: string): boolean {
  const runtime = runtimes.get(sessionId);
  if (!runtime?.current) return false;
  runtime.interruptRequested = true;
  emit(runtime, {
    kind: "lifecycle",
    id: randomUUID(),
    stage: "interrupt",
    label: "Interrupt requested",
  });
  runtime.current.kill("SIGTERM");
  return true;
}

function runNext(sessionId: string): void {
  const runtime = runtimes.get(sessionId);
  if (!runtime) return;

  const text = runtime.queue.shift();
  if (text === undefined) return;

  emit(runtime, { kind: "status", id: randomUUID(), status: "running" });
  emit(runtime, {
    kind: "lifecycle",
    id: randomUUID(),
    stage: "attached",
    label: "Attached to session",
  });

  const child = spawnPrompt(sessionId, text);
  runtime.current = child;

  let stdout = "";
  let stderrTail = "";
  let lineBuffer = "";

  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString("utf8");
  });

  child.stderr.on("data", (chunk: Buffer) => {
    const chunkText = chunk.toString("utf8");
    stderrTail = (stderrTail + chunkText).slice(-4000);
    lineBuffer += chunkText;
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop() ?? "";
    for (const line of lines) {
      const parsed = parseProgressLine(line);
      if (parsed) {
        emit(runtime, { kind: "tool", id: randomUUID(), name: parsed.name, summary: parsed.summary });
      }
    }
  });

  const finish = (code: number | null, spawnError?: Error) => {
    const wasInterrupted = runtime.interruptRequested;
    runtime.interruptRequested = false;
    runtime.current = null;

    if (spawnError) {
      emit(runtime, { kind: "status", id: randomUUID(), status: "error", detail: spawnError.message });
    } else if (code === 0) {
      try {
        JSON.parse(stdout);
        emit(runtime, { kind: "status", id: randomUUID(), status: "idle" });
      } catch {
        emit(runtime, {
          kind: "status",
          id: randomUUID(),
          status: "error",
          detail: "Could not parse the agent's response.",
        });
      }
    } else if (wasInterrupted) {
      // Killed on purpose via "STOP" - not a failure, just go idle. The
      // follow-up "tone it down" message is already queued right behind it.
      emit(runtime, { kind: "status", id: randomUUID(), status: "idle" });
    } else {
      emit(runtime, {
        kind: "status",
        id: randomUUID(),
        status: "error",
        detail: stderrTail.trim().slice(-300) || `doctl exited with code ${code}`,
      });
    }

    emit(runtime, {
      kind: "lifecycle",
      id: randomUUID(),
      stage: "detached",
      label: "Detached from session",
    });

    runNext(sessionId);
  };

  child.on("close", (code) => finish(code));
  child.on("error", (err) => finish(null, err));
}
