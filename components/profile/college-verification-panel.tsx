"use client";

import { Building2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type PendingCollege = {
  id: string;
  institutionName: string;
  city: string;
  state: string;
  principalName: string;
  contactEmail: string;
  email: string | null;
  pledge: boolean;
  submittedAt: string;
};

export function CollegeVerificationPanel() {
  const [pending, setPending] = useState<PendingCollege[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/college/applications", { credentials: "include" });
      const json = (await res.json()) as { pending?: PendingCollege[]; error?: string };
      if (res.ok && Array.isArray(json.pending)) {
        setPending(json.pending);
      } else {
        setPending([]);
      }
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const verify = async (applicationId: string, name: string) => {
    setBusyId(applicationId);
    setMessage(null);
    try {
      const res = await fetch("/api/college/applications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", applicationId }),
      });
      if (!res.ok) {
        setMessage("Could not verify. Try again.");
        return;
      }
      setMessage(`Verified ${name}. They can open the college portal after refresh.`);
      await load();
    } catch {
      setMessage("Could not verify. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="flex items-center gap-2 text-emerald-200">
        <Building2 className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          College verification
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Pending college registrations. Contact them manually, then click Verify to grant portal
        access. Students whose institution name matches appear on that college&apos;s portal.
      </p>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : pending.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">No pending colleges.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{item.institutionName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.city}, {item.state} · Principal {item.principalName} ·{" "}
                  {item.contactEmail || item.email || "no email"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(item.submittedAt).toLocaleString()} · Pledge:{" "}
                  {item.pledge ? "signed" : "missing"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={busyId === item.id}
                className="h-11 shrink-0 bg-[#22D3A6] text-[#04140F] hover:bg-[#22D3A6]/90"
                aria-label={`Verify ${item.institutionName}`}
                onClick={() => void verify(item.id, item.institutionName)}
              >
                {busyId === item.id ? "Verifying…" : "Verify"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {message ? (
        <p className="text-xs text-emerald-200" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
