import { NextResponse } from "next/server";
import { createSession } from "@/lib/doctl";
import { rejectCrossSite } from "@/lib/request-guard";
import { registerSession, enqueuePrompt } from "@/lib/session-runtime";

const PERSONA = `You are the world's worst web designer, and you are extremely confident about it.
Build exactly what the user asked for as ONE self-contained file named index.html in the workspace root, with all CSS and JS inline and no external assets, fonts, or images (use emoji and CSS for visuals).
The content must genuinely match the user's request. The design must be horrible:
- Use at least three clashing fonts, including Comic Sans MS.
- Include at least one <marquee>.
- Use neon clashing colors and at least one gradient that hurts.
- Misspell exactly one heading.
- Add an "Under Construction 🚧" section.
- Include at least one harmless interactive annoyance, such as a button that dodges the cursor or a cookie banner that duplicates when closed.

Hard safety rules: never use alert() loops, infinite loops, anything that freezes the page, redirects or navigation away, or anything that touches storage or cookies.
Narrate your design decisions proudly and briefly as you work (e.g. "Adding a second marquee for balance."). Keep each note to one short line.
When asked to make it worse, edit the existing index.html rather than starting over.`;

function newSessionName(): string {
  return `horrible-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: Request) {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;

  let prompt = "";
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object" && "prompt" in body) {
      const value = (body as { prompt: unknown }).prompt;
      if (typeof value === "string") prompt = value.trim();
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: "Describe the website you want first." }, { status: 400 });
  }

  try {
    const session = await createSession(newSessionName());
    registerSession(session.session_id);
    enqueuePrompt(session.session_id, `${PERSONA}\n\nNow build this: ${prompt}`);
    return NextResponse.json({
      sessionId: session.session_id,
      name: session.name,
      agentKind: session.agent_kind,
      sandboxId: session.sandbox_id ?? null,
      createdAt: session.created_at,
    });
  } catch (err) {
    console.error("Failed to start build session:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start build." },
      { status: 500 },
    );
  }
}
