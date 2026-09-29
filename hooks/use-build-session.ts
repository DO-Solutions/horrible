"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { BuildEvent } from "@/lib/build-events";
import type { SessionInfo } from "@/components/horrible/session-info";

export type ClientStatus =
  | "connecting"
  | "running"
  | "idle"
  | "interrupted"
  | "terminated"
  | "error";

export type Phase = "prompt" | "building";

interface BuildSessionState {
  phase: Phase;
  sessionId: string | null;
  sessionInfo: SessionInfo | null;
  events: BuildEvent[];
  status: ClientStatus;
  starting: boolean;
  siteHtml: string | null;
}

const INITIAL_STATE: BuildSessionState = {
  phase: "prompt",
  sessionId: null,
  sessionInfo: null,
  events: [],
  status: "connecting",
  starting: false,
  siteHtml: null,
};

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "error" in body) {
      const value = (body as { error: unknown }).error;
      if (typeof value === "string") return value;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function useBuildSession() {
  const [state, setState] = useState<BuildSessionState>(INITIAL_STATE);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const interruptingRef = useRef(false);
  const announcedCompleteRef = useRef(false);

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const fetchSite = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/build/${sessionId}/site`);
      if (!res.ok) return;
      const html = await res.text();
      setState((s) => (s.sessionId === sessionId ? { ...s, siteHtml: html } : s));
      if (!announcedCompleteRef.current) {
        announcedCompleteRef.current = true;
        toast.success("Build complete. We're so sorry.");
      }
    } catch {
      // Preview stays on the skeleton; the next idle/terminated event retries.
    }
  }, []);

  const attachStream = useCallback(
    (sessionId: string) => {
      closeStream();
      seenIds.current = new Set();
      const source = new EventSource(`/api/build/${sessionId}/stream`);
      eventSourceRef.current = source;

      source.onmessage = (message) => {
        let event: BuildEvent;
        try {
          event = JSON.parse(message.data) as BuildEvent;
        } catch {
          return;
        }

        if (seenIds.current.has(event.id)) return;
        seenIds.current.add(event.id);

        setState((s) => {
          if (s.sessionId !== sessionId) return s;
          const events = [...s.events, event];

          let status = s.status;
          if (event.kind === "status") {
            if (event.status === "running") {
              interruptingRef.current = false;
              status = "running";
            } else if (event.status === "idle") {
              status = interruptingRef.current ? "interrupted" : "idle";
            } else if (event.status === "terminated") {
              status = "terminated";
            } else if (event.status === "error") {
              status = "error";
              toast.error(event.detail ?? "Something went wrong mid-build.");
            }
          }

          return { ...s, events, status };
        });

        if (event.kind === "status" && (event.status === "idle" || event.status === "terminated")) {
          void fetchSite(sessionId);
        }
      };

      source.onerror = () => {
        // EventSource retries automatically; nothing to do here besides
        // letting the (deduped) reconnect backfill history.
      };
    },
    [closeStream, fetchSite],
  );

  const startBuild = useCallback(
    async (prompt: string) => {
      setState((s) => ({ ...s, starting: true }));
      try {
        const res = await fetch("/api/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) {
          throw new Error(await readError(res, "Failed to start the build."));
        }
        const data = (await res.json()) as {
          sessionId: string;
          name: string;
          agentKind: string;
          sandboxId: string | null;
          createdAt: string;
        };

        announcedCompleteRef.current = false;
        interruptingRef.current = false;
        setState({
          ...INITIAL_STATE,
          phase: "building",
          sessionId: data.sessionId,
          sessionInfo: {
            sessionId: data.sessionId,
            name: data.name,
            agentKind: data.agentKind,
            sandboxId: data.sandboxId,
            createdAt: data.createdAt,
          },
          starting: false,
        });
        attachStream(data.sessionId);
      } catch (err) {
        setState((s) => ({ ...s, starting: false }));
        toast.error(err instanceof Error ? err.message : "Failed to start the build.");
      }
    },
    [attachStream],
  );

  const makeItWorse = useCallback(async () => {
    if (!state.sessionId) return;
    try {
      const res = await fetch(`/api/build/${state.sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Make it even worse. Edit the existing index.html - don't start over.",
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Failed to send that."));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send that.");
    }
  }, [state.sessionId]);

  const stop = useCallback(async () => {
    if (!state.sessionId) return;
    interruptingRef.current = true;
    setState((s) => (s.sessionId ? { ...s, status: "interrupted" } : s));
    try {
      const res = await fetch(`/api/build/${state.sessionId}/interrupt`, { method: "POST" });
      if (!res.ok) throw new Error(await readError(res, "Failed to interrupt."));
    } catch (err) {
      interruptingRef.current = false;
      toast.error(err instanceof Error ? err.message : "Failed to interrupt.");
    }
  }, [state.sessionId]);

  const startOver = useCallback(() => {
    closeStream();
    interruptingRef.current = false;
    announcedCompleteRef.current = false;
    setState(INITIAL_STATE);
  }, [closeStream]);

  useEffect(() => closeStream, [closeStream]);

  return { state, startBuild, makeItWorse, stop, startOver };
}
