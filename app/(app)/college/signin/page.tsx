"use client";

import { Suspense } from "react";

import { CollegeRegistrationForm } from "@/components/college/college-registration-form";

export default function CollegeSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#070B0D]">
          <div className="size-8 animate-spin rounded-full border-2 border-[#22D3A6] border-t-transparent" />
        </div>
      }
    >
      <CollegeRegistrationForm />
    </Suspense>
  );
}
