import { NextResponse } from "next/server";
import { isValidSessionId } from "@/lib/request-guard";
import { catWorkspaceFile, DoctlError } from "@/lib/doctl";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/build/[sessionId]/site">,
) {
  const { sessionId } = await ctx.params;
  if (!isValidSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  try {
    const html = await catWorkspaceFile(sessionId, "index.html");
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Generated HTML is untrusted: even if opened directly (outside the
        // preview iframe) it runs in an opaque origin, not this app's.
        "Content-Security-Policy": "sandbox allow-scripts",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof DoctlError) {
      return NextResponse.json(
        { error: "index.html isn't ready yet. Try again in a moment." },
        { status: 404 },
      );
    }
    console.error("Failed to fetch generated site:", err);
    return NextResponse.json({ error: "Failed to fetch the generated site." }, { status: 500 });
  }
}
