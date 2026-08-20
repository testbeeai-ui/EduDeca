import { NextRequest, NextResponse } from "next/server";

import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import { getCollegeApplicationById } from "@/lib/college/registry-store";
import { isCollegeUploadKind } from "@/lib/college/upload-meta";
import {
  contentTypeForCollegeUpload,
  readCollegeUploadFile,
} from "@/lib/college/upload-store";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Admin-only download of a college registration student-list upload.
 * GET /api/college/uploads?applicationId=...&kind=xi|xii
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isTesterInvestorEmail(data.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applicationId = request.nextUrl.searchParams.get("applicationId")?.trim() ?? "";
  const kindRaw = request.nextUrl.searchParams.get("kind")?.trim() ?? "";
  if (!applicationId || !isCollegeUploadKind(kindRaw)) {
    return NextResponse.json({ error: "Invalid applicationId or kind" }, { status: 400 });
  }

  const application = await getCollegeApplicationById(applicationId);
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storedRelPath =
    kindRaw === "xi" ? application.xiStoredRelPath : application.xiiStoredRelPath;
  const originalName =
    kindRaw === "xi" ? application.xiFileName : application.xiiFileName;

  if (!storedRelPath?.trim()) {
    return NextResponse.json({ error: "No file uploaded for this class" }, { status: 404 });
  }

  const file = await readCollegeUploadFile(storedRelPath);
  if (!file) {
    return NextResponse.json({ error: "File missing on server" }, { status: 404 });
  }

  const downloadName = (originalName?.trim() || `${kindRaw}-students.xlsx`).replace(
    /[\r\n"]/g,
    "_",
  );
  const headers = new Headers();
  headers.set("Content-Type", contentTypeForCollegeUpload(downloadName));
  headers.set("Content-Length", String(file.bytes.byteLength));
  headers.set(
    "Content-Disposition",
    `attachment; filename="${downloadName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
  );
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(new Uint8Array(file.bytes), { status: 200, headers });
}
