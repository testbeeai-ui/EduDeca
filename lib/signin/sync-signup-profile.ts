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

/**
 * After Google auth: write local class/college/location to edudeca_profiles
 * without overwriting existing non-empty values, and hydrate the local store
 * from existing EduDeca profile values when local is blank.
 */
export async function syncSignupProfileFromLocal(): Promise<void> {
  const store = useAppStore.getState();
  const userId = store.userId;
  if (!userId) return;

  const { data, error } = await supabase
    .from("edudeca_profiles")
    .select("class_level, institution_name, state, city, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[signup-profile] edudeca_profiles select failed", error);
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

  const { data: authData } = await supabase.auth.getUser();
  if (authData.user?.id !== userId) return;
  const sessionEmail = authData.user.email?.trim() ?? "";
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
    console.error("[signup-profile] edudeca_profiles upsert failed", upsertError);
  }
}
