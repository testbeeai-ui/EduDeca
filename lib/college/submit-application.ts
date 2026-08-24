import type { CollegeRegistrationDraft } from "@/lib/college/registration";
import { clearCollegeRegistrationDraft } from "@/lib/college/registration";
import { clearStagedCollegeUploads, stagedUploadsToFiles } from "@/lib/college/pending-upload-files";

/** Submit college application JSON + optional staged XI/XII files. */
export async function submitCollegeApplicationWithUploads(
  draft: CollegeRegistrationDraft,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { xiFile, xiiFile } = await stagedUploadsToFiles();
  const form = new FormData();
  form.append("draft", JSON.stringify(draft));
  if (xiFile) form.append("xiFile", xiFile, xiFile.name);
  if (xiiFile) form.append("xiiFile", xiiFile, xiiFile.name);

  const res = await fetch("/api/college/applications", {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: json.error || "Could not submit college application." };
  }

  await clearStagedCollegeUploads();
  clearCollegeRegistrationDraft();
  return { ok: true };
}
