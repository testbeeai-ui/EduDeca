import { Suspense } from "react";

import JoinClient from "./join-client";

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <JoinClient />
    </Suspense>
  );
}
