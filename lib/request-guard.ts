import { NextResponse } from "next/server";

/**
 * Rejects cross-site requests. This app has no auth and spends the user's
 * DigitalOcean balance, so a random web page must not be able to POST to
 * http://localhost:3100 while the app is running.
 */
export function rejectCrossSite(req: Request): NextResponse | null {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }
  return null;
}

/** doctl session IDs are simple slugs; anything else is never a real session. */
export function isValidSessionId(id: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id);
}
