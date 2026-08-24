import {
  buildFillIfEmptyEduDecaProfilePatch,
  isSignupClassCollegeReady,
  shouldWriteEduDecaEmail,
  type EduDecaProfileRow,
  type SignupClassLevel,
} from "@/lib/signin/signup-profile";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

function asSignupClassLevel(value: unknown): SignupClassLevel | null {
  if (value === 11 || value === 12) return value;
  return null;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatSupabaseError(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}): string {
  return [
    error.message || "(no message)",
    error.code ? `code=${error.code}` : null,
    error.status != null ? `status=${error.status}` : null,
    error.details ? `details=${error.details}` : null,
    error.hint ? `hint=${error.hint}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function isAuthSessionError(error: { message?: string; code?: string; status?: number }): boolean {
  const msg = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();
  if (error.status === 401 || error.status === 403) return true;
  if (code.includes("pgrst301") || code === "401" || code === "403") return true;
  return (
    msg.includes("jwt") ||
    msg.includes("not authenticated") ||
    msg.includes("session") ||
    msg.includes("unauthorized")
  );
}

/**
 * After Google auth: write local class/college/location to edudeca_profiles
 * without overwriting existing non-empty values, and hydrate the local store
 * from existing EduDeca profile values when local is blank.
 */
export async function syncSignupProfileFromLocal(): Promise<void> {
  const store = useAppStore.getState();

  // Prefer live auth session over persisted store userId (avoids stale-id races).
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    if (isAuthSessionError(authError)) return;
    console.warn(
      "[signup-profile] getUser failed",
      formatSupabaseError(authError),
    );
    return;
  }

  const user = authData.user;
  if (!user?.id) return;

  // Store may still be catching up after OAuth; align if needed.
  if (store.userId && store.userId !== user.id) {
    console.warn("[signup-profile] store userId mismatch; using auth user", {
      storeUserId: store.userId,
      authUserId: user.id,
    });
  }

  const userId = user.id;

  const { data, error } = await supabase
    .from("edudeca_profiles")
    .select("class_level, institution_name, state, city, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isAuthSessionError(error)) {
      // Common during cookie/session settle right after OAuth — not actionable noise.
      return;
    }
    console.error(
      "[signup-profile] edudeca_profiles select failed",
      formatSupabaseError(error),
    );
    return;
  }

  const existing: EduDecaProfileRow = {
    class_level: (data?.class_level as number | null | undefined) ?? null,
    institution_name:
      (data?.institution_name as string | null | undefined) ?? null,
    state: (data?.state as string | null | undefined) ?? null,
    city: (data?.city as string | null | undefined) ?? null,
    email: (data?.email as string | null | undefined) ?? null,
  };

  const existingClass = asSignupClassLevel(existing.class_level);
  if (store.signupClassLevel == null && existingClass != null) {
    store.setSignupClassLevel(existingClass);
  }
  const existingCollege = asText(existing.institution_name);
  if (!store.signupCollege.trim() && existingCollege) {
    store.setSignupCollege(existingCollege);
  }
  const existingState = asText(existing.state);
  if (!store.signupState.trim() && existingState) {
    store.setSignupState(existingState);
  }
  const existingCity = asText(existing.city);
  if (!store.signupCity.trim() && existingCity) {
    store.setSignupCity(existingCity);
  }

  const next = useAppStore.getState();
  const patch = isSignupClassCollegeReady(next.signupClassLevel, next.signupCollege)
    ? buildFillIfEmptyEduDecaProfilePatch(
        {
          classLevel: next.signupClassLevel as SignupClassLevel,
          college: next.signupCollege,
          state: next.signupState,
          city: next.signupCity,
        },
        existing,
      )
    : null;

  const sessionEmail = user.email?.trim() ?? "";
  const writeEmail = shouldWriteEduDecaEmail(existing.email) && sessionEmail.length > 0;

  if (!patch && !writeEmail) return;

  const { error: upsertError } = await supabase.from("edudeca_profiles").upsert(
    {
      id: userId,
      ...(patch ?? {}),
      ...(writeEmail ? { email: sessionEmail } : {}),
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    if (isAuthSessionError(upsertError)) return;
    console.error(
      "[signup-profile] edudeca_profiles upsert failed",
      formatSupabaseError(upsertError),
    );
  }
}
