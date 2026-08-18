import { citiesForState } from "@/lib/signin/india-locations";
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

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * After Google auth: write local class/college/location to profiles only where empty,
 * and hydrate the local store from existing profile values when local is blank.
 */
export async function syncSignupProfileFromLocal(): Promise<void> {
  const store = useAppStore.getState();
  const userId = store.userId;
  if (!userId) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("class_level, institution_name, stream, state, city")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[signup-profile] profiles select failed", error);
    return;
  }

  const existing = {
    class_level: (data?.class_level as number | null | undefined) ?? null,
    institution_name: asTrimmed(data?.institution_name) || null,
    stream: asTrimmed(data?.stream) || null,
    state: asTrimmed(data?.state) || null,
    city: asTrimmed(data?.city) || null,
  };

  const existingClass = asSignupClassLevel(existing.class_level);
  if (store.signupClassLevel == null && existingClass != null) {
    store.setSignupClassLevel(existingClass);
  }
  if (!store.signupCollege.trim() && existing.institution_name) {
    store.setSignupCollege(existing.institution_name);
  }
  if (!store.signupState.trim() && existing.state) {
    store.setSignupState(existing.state);
  }
  if (!store.signupCity.trim() && existing.city) {
    const allowed = citiesForState(existing.state ?? store.signupState);
    if (allowed.includes(existing.city) || allowed.length === 0) {
      store.setSignupCity(existing.city);
    }
  }

  const next = useAppStore.getState();
  if (!isSignupProfileReady(next.signupClassLevel, next.signupCollege)) {
    return;
  }

  const patch = buildFillIfEmptyProfilePatch(
    {
      classLevel: next.signupClassLevel as SignupClassLevel,
      college: next.signupCollege,
      stream: next.signupScienceStream ? "science" : null,
      state: next.signupState,
      city: next.signupCity,
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
