import { NextResponse } from "next/server";
import { rejectCrossSite } from "@/lib/request-guard";
import { enqueuePrompt } from "@/lib/session-runtime";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/build/[sessionId]/message">,
) {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const { sessionId } = await ctx.params;

  let text = "";
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object" && "text" in body) {
      const value = (body as { text: unknown }).text;
      if (typeof value === "string") text = value.trim();
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }

  if (!enqueuePrompt(sessionId, text)) {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
