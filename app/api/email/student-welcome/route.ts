import { NextResponse } from "next/server";

import { sendStudentWelcomeEmail } from "@/lib/email/sendStudentWelcomeEmail";

function authorize(request: Request): boolean {
  const secret = process.env.EDUDECA_INTERNAL_API_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization")?.trim() ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  return bearer.length > 0 && bearer === secret;
}

/**
 * Internal: send EduDeca student welcome mail.
 * Called by EduBlast Web after first interest registration.
 * Auth: Authorization: Bearer <EDUDECA_INTERNAL_API_SECRET>
 */
export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { email: rawEmail, displayName, userId } = body as {
    email?: unknown;
    displayName?: unknown;
    userId?: unknown;
  };

  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 422 });
  }

  const ok = await sendStudentWelcomeEmail({
    email,
    displayName: typeof displayName === "string" ? displayName : undefined,
    userId: typeof userId === "string" ? userId : null,
  });

  if (!ok) {
    return NextResponse.json({ error: "Send failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
