import { NextResponse } from "next/server";
import { rejectCrossSite } from "@/lib/request-guard";
import { interruptSession, enqueuePrompt } from "@/lib/session-runtime";

const TONE_IT_DOWN_MESSAGE =
  "Fine. Tone it down. Just slightly - don't lose your edge completely.";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/build/[sessionId]/interrupt">,
) {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const { sessionId } = await ctx.params;

  interruptSession(sessionId);

  // The remote run may still be wrapping up briefly even though we've
  // stopped watching it locally - there's no true server-side cancel yet.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!enqueuePrompt(sessionId, TONE_IT_DOWN_MESSAGE)) {
    return NextResponse.json({ error: "Unknown session." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
