import { getSessionEvents, subscribeSession } from "@/lib/session-runtime";
import type { BuildEvent } from "@/lib/build-events";

export const dynamic = "force-dynamic";

function sseFrame(event: BuildEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/build/[sessionId]/stream">,
) {
  const { sessionId } = await ctx.params;

  const history = getSessionEvents(sessionId);
  if (history === null) {
    const notFound: BuildEvent = {
      kind: "status",
      id: "unknown-session",
      status: "error",
      detail: "Unknown session - it may have started before the server last restarted.",
    };
    return new Response(`data: ${JSON.stringify(notFound)}\n\n`, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: BuildEvent) => {
        if (cancelled) return;
        controller.enqueue(sseFrame(event));
      };

      for (const event of history) send(event);
      unsubscribe = subscribeSession(sessionId, send);
      heartbeat = setInterval(() => {
        if (!cancelled) controller.enqueue(new TextEncoder().encode(": ping\n\n"));
      }, 15000);
    },
    cancel() {
      cancelled = true;
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
