import {
  buildFillIfEmptyProfilePatch,
  isSignupProfileReady,
  type SignupClassLevel,
} from "@/lib/signin/signup-profile";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

function asSignupClassLevel(value: unknown): SignupClassLevel | null {
  if (value === 11 || value === 12) return value;
  return null;
}

/**
 * After Google auth: write local class/college to profiles only where empty,
 * and hydrate the local store from existing profile values when local is blank.
 */
export async function syncSignupProfileFromLocal(): Promise<void> {
  const store = useAppStore.getState();
  const userId = store.userId;
  if (!userId) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("class_level, institution_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[signup-profile] profiles select failed", error);
    return;
  }

  const existing = {
    class_level: (data?.class_level as number | null | undefined) ?? null,
    institution_name:
      (data?.institution_name as string | null | undefined) ?? null,
  };

  // Prefer existing shared profile values into local store when local is empty.
  const existingClass = asSignupClassLevel(existing.class_level);
  if (store.signupClassLevel == null && existingClass != null) {
    store.setSignupClassLevel(existingClass);
  }
  const existingCollege = (existing.institution_name ?? "").trim();
  if (!store.signupCollege.trim() && existingCollege) {
    store.setSignupCollege(existingCollege);
  }

  const next = useAppStore.getState();
  if (!isSignupProfileReady(next.signupClassLevel, next.signupCollege)) {
    return;
  }

  const patch = buildFillIfEmptyProfilePatch(
    {
      classLevel: next.signupClassLevel as SignupClassLevel,
      college: next.signupCollege,
    },
    existing,
  );

  if (!patch) return;

  const { error: updateError } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (updateError) {
    console.error("[signup-profile] profiles update failed", updateError);
  }
}
