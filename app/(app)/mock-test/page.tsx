import { Suspense } from "react";

import { MockTestLanding } from "@/components/mock-test/mock-test-landing";

export default function MockTestPage() {
  return (
    <Suspense fallback={null}>
      <MockTestLanding />
    </Suspense>
  );
}
