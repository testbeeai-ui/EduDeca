"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "@/components/admin/admin-console.module.css";
import { isTesterInvestorEmail } from "@/lib/admin/tester-allowlist";
import type {
  CollegeApplicationAdminView,
  CollegeRosterStudent,
} from "@/lib/college/registry-store";
import { useAppStore } from "@/store/useAppStore";

import { AdminInvitesView } from "@/components/admin/admin-invites-view";

type Filter = "pending" | "approved" | "all";
type AdminTab = "verifications" | "invites";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function streamLabel(math: boolean, bio: boolean): string {
  if (math && bio) return "PCM + PCB";
  if (math) return "PCM (Math)";
  if (bio) return "PCB (Bio)";
  return "Not specified";
}

function classLabel(level: CollegeRosterStudent["classLevel"]): string {
  if (level === 11) return "XI";
  if (level === 12) return "XII";
  return "—";
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailField}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={styles.detailValue}>{value}</div>
    </div>
  );
}

export function AdminConsole() {
  const router = useRouter();
  const email = useAppStore((s) => s.email);
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const isAdmin = isTesterInvestorEmail(email);

  const [apps, setApps] = useState<CollegeApplicationAdminView[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("verifications");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/college/applications", { credentials: "include" });
      const json = (await res.json()) as {
        applications?: CollegeApplicationAdminView[];
        pending?: CollegeApplicationAdminView[];
        error?: string;
      };
      if (!res.ok) {
        setApps([]);
        return;
      }
      if (Array.isArray(json.applications)) {
        setApps(
          json.applications.map((a) => ({
            ...a,
            xiFileName: a.xiFileName ?? null,
            xiiFileName: a.xiiFileName ?? null,
            xiStoredRelPath: a.xiStoredRelPath ?? null,
            xiiStoredRelPath: a.xiiStoredRelPath ?? null,
            roster: Array.isArray(a.roster) ? a.roster : [],
          })),
        );
      } else if (Array.isArray(json.pending)) {
        setApps(
          json.pending.map((a) => ({
            ...a,
            xiFileName: a.xiFileName ?? null,
            xiiFileName: a.xiiFileName ?? null,
            xiStoredRelPath: a.xiStoredRelPath ?? null,
            xiiStoredRelPath: a.xiiStoredRelPath ?? null,
            roster: Array.isArray(a.roster) ? a.roster : [],
          })),
        );
      } else {
        setApps([]);
      }
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isSignedIn) {
      router.replace("/signin");
      return;
    }
    if (!isAdmin) return;
    void load();
  }, [hasHydrated, isSignedIn, isAdmin, load, router]);

  const counts = useMemo(() => {
    const pending = apps.filter((a) => a.status === "pending").length;
    const approved = apps.filter((a) => a.status === "approved").length;
    return { pending, approved, total: apps.length };
  }, [apps]);

  const rows = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => a.status === filter);
  }, [apps, filter]);

  const selected = useMemo(
    () => apps.find((a) => a.id === selectedId) ?? null,
    [apps, selectedId],
  );

  const verify = async (id: string, name: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch("/api/college/applications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", applicationId: id }),
      });
      if (!res.ok) {
        setMessage("Verification failed. Try again.");
        return;
      }
      setMessage(`${name} is verified. They can open the college portal now.`);
      await load();
    } catch {
      setMessage("Verification failed. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!hasHydrated) {
    return (
      <div className={styles.denied}>
        <p>Loading admin…</p>
      </div>
    );
  }

  if (!isSignedIn || !isAdmin) {
    return (
      <div className={styles.denied}>
        <div className={styles.deniedCard}>
          <h1 className={styles.deniedTitle}>Admin access required</h1>
          <p>
            Sign in with an allowlisted EduDeca admin Google account to open the console.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link href="/signin" className={styles.footLink}>
              Go to student sign-in →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.mark}>ED</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>EduDeca</span>
            <span className={styles.brandSub}>Admin Console</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin">
          <button
            type="button"
            onClick={() => setActiveTab("verifications")}
            className={`${styles.navItem} ${activeTab === "verifications" ? styles.navItemActive : ""}`}
            style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "none", border: "none" }}
          >
            College verifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invites")}
            className={`${styles.navItem} ${activeTab === "invites" ? styles.navItemActive : ""}`}
            style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "none", border: "none" }}
          >
            Email invitations &amp; tracking
          </button>
        </nav>

        <div className={styles.sidebarFoot}>
          <span style={{ fontSize: 11, color: "var(--ad-dim)" }}>{email}</span>
          <Link href="/home" className={styles.footLink}>
            ← Back to student app
          </Link>
          <Link href="/profile" className={styles.footLink}>
            Profile &amp; tester tools
          </Link>
        </div>
      </aside>

      <div className={styles.main}>
        {activeTab === "invites" ? (
          <div className={styles.content} style={{ padding: 24 }}>
            <AdminInvitesView />
          </div>
        ) : (
          <>
            <header className={styles.topbar}>
              <div>
                <h1 className={styles.pageTitle}>College verifications</h1>
                <p className={styles.pageSub}>
                  Open an application to review every registration field and student data, then
                  verify portal access.
                </p>
              </div>
              <button type="button" className={styles.ghostBtn} onClick={() => void load()}>
                Refresh
              </button>
            </header>

            <div className={styles.content}>
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pending</div>
              <div className={styles.statValue}>{counts.pending}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Verified</div>
              <div className={styles.statValue}>{counts.approved}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total applications</div>
              <div className={styles.statValue}>{counts.total}</div>
            </div>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Applications</h2>
              <div className={styles.filters} role="group" aria-label="Filter applications">
                {(
                  [
                    ["pending", "Pending"],
                    ["approved", "Verified"],
                    ["all", "All"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.chip} ${filter === id ? styles.chipActive : ""}`}
                    aria-pressed={filter === id}
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className={styles.empty}>Loading applications…</p>
            ) : rows.length === 0 ? (
              <p className={styles.empty}>No applications in this view.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table} aria-label="College applications">
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>Students declared</th>
                      <th>Contact</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isOpen = selectedId === row.id;
                      return (
                        <tr
                          key={row.id}
                          className={isOpen ? styles.rowSelected : styles.rowClickable}
                          onClick={() => setSelectedId(isOpen ? null : row.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedId(isOpen ? null : row.id);
                            }
                          }}
                          tabIndex={0}
                          aria-expanded={isOpen}
                          aria-label={`View full details for ${row.institutionName}`}
                        >
                          <td>
                            <div className={styles.instName}>{row.institutionName}</div>
                            <div className={styles.instMeta}>
                              {row.city}, {row.state}
                            </div>
                          </td>
                          <td>
                            <div>
                              XI {row.xiCount || "—"} · XII {row.xiiCount || "—"}
                            </div>
                            <div className={styles.instMeta}>
                              {streamLabel(row.math, row.bio)}
                            </div>
                          </td>
                          <td>
                            <div>{row.contactName}</div>
                            <div className={styles.instMeta}>
                              {row.contactMobile || row.contactEmail || "—"}
                            </div>
                          </td>
                          <td>{formatWhen(row.submittedAt)}</td>
                          <td>
                            <span
                              className={`${styles.statusPill} ${
                                row.status === "approved"
                                  ? styles.statusApproved
                                  : row.status === "rejected"
                                    ? styles.statusRejected
                                    : styles.statusPending
                              }`}
                            >
                              {row.status === "approved" ? "Verified" : row.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionStack}>
                              <button
                                type="button"
                                className={styles.ghostBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(isOpen ? null : row.id);
                                }}
                              >
                                {isOpen ? "Hide details" : "View details"}
                              </button>
                              {row.status === "pending" ? (
                                <button
                                  type="button"
                                  className={styles.verifyBtn}
                                  disabled={busyId === row.id}
                                  aria-label={`Verify ${row.institutionName}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void verify(row.id, row.institutionName);
                                  }}
                                >
                                  {busyId === row.id ? "Verifying…" : "Verify"}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selected ? (
            <section
              className={styles.detailPanel}
              aria-label={`Full application for ${selected.institutionName}`}
            >
              <div className={styles.detailHead}>
                <div>
                  <h2 className={styles.panelTitle}>{selected.institutionName}</h2>
                  <p className={styles.pageSub}>
                    Full registration packet ·{" "}
                    {selected.status === "approved" ? "Verified" : selected.status}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => setSelectedId(null)}
                >
                  Close
                </button>
              </div>

              <div className={styles.detailBody}>
                <h3 className={styles.sectionTitle}>Institution</h3>
                <div className={styles.detailGrid}>
                  <DetailField label="Institution name" value={selected.institutionName} />
                  <DetailField label="State" value={selected.state || "—"} />
                  <DetailField label="City" value={selected.city || "—"} />
                  <DetailField
                    label="Google account (applicant)"
                    value={selected.email || "—"}
                  />
                  <DetailField label="Applicant user id" value={selected.userId} />
                  <DetailField label="Submitted" value={formatWhen(selected.submittedAt)} />
                  <DetailField
                    label="Verified at"
                    value={selected.verifiedAt ? formatWhen(selected.verifiedAt) : "—"}
                  />
                  <DetailField
                    label="Pledge"
                    value={selected.pledge ? "Signed" : "Missing"}
                  />
                </div>

                <h3 className={styles.sectionTitle}>Student strength &amp; streams</h3>
                <div className={styles.detailGrid}>
                  <DetailField label="Class XI students (declared)" value={selected.xiCount || "—"} />
                  <DetailField
                    label="Class XII students (declared)"
                    value={selected.xiiCount || "—"}
                  />
                  <DetailField label="Streams offered" value={streamLabel(selected.math, selected.bio)} />
                  <DetailField
                    label="Math track"
                    value={selected.math ? "Yes" : "No"}
                  />
                  <DetailField label="Bio track" value={selected.bio ? "Yes" : "No"} />
                </div>

                <h3 className={styles.sectionTitle}>Uploaded student lists</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailField}>
                    <div className={styles.detailLabel}>Class XI file</div>
                    <div className={styles.detailValue}>
                      {selected.xiFileName?.trim() || "Not uploaded (optional)"}
                    </div>
                    {selected.xiStoredRelPath ? (
                      <a
                        className={styles.downloadLink}
                        href={`/api/college/uploads?applicationId=${encodeURIComponent(selected.id)}&kind=xi`}
                      >
                        Download XI spreadsheet
                      </a>
                    ) : null}
                  </div>
                  <div className={styles.detailField}>
                    <div className={styles.detailLabel}>Class XII file</div>
                    <div className={styles.detailValue}>
                      {selected.xiiFileName?.trim() || "Not uploaded (optional)"}
                    </div>
                    {selected.xiiStoredRelPath ? (
                      <a
                        className={styles.downloadLink}
                        href={`/api/college/uploads?applicationId=${encodeURIComponent(selected.id)}&kind=xii`}
                      >
                        Download XII spreadsheet
                      </a>
                    ) : null}
                  </div>
                </div>
                <p className={styles.hint}>
                  When a college attaches .csv or .xlsx lists, the files are stored with the
                  application. Use Download above to open them. Older applications may only
                  show a filename if they were submitted before file storage was enabled.
                </p>

                <h3 className={styles.sectionTitle}>Principal</h3>
                <div className={styles.detailGrid}>
                  <DetailField label="Name" value={selected.principalName || "—"} />
                  <DetailField label="Mobile" value={selected.principalMobile || "—"} />
                  <DetailField label="Email" value={selected.principalEmail || "—"} />
                </div>

                <h3 className={styles.sectionTitle}>Primary contact</h3>
                <div className={styles.detailGrid}>
                  <DetailField label="Name" value={selected.contactName || "—"} />
                  <DetailField label="Mobile" value={selected.contactMobile || "—"} />
                  <DetailField label="Email" value={selected.contactEmail || "—"} />
                </div>

                <h3 className={styles.sectionTitle}>
                  Linked EduDeca students ({selected.roster.length})
                </h3>
                {selected.roster.length === 0 ? (
                  <p className={styles.hint}>
                    No students are linked yet. After you verify this college, students who
                    signed in with a matching institution name appear here as they use the app.
                  </p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.rosterTable} aria-label="Linked students">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Student ID</th>
                          <th>Class</th>
                          <th>Level</th>
                          <th>Fees</th>
                          <th>Last challenge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.roster.map((s) => (
                          <tr key={s.userId}>
                            <td>{s.displayName}</td>
                            <td>{s.studentCode?.trim() || "—"}</td>
                            <td>{classLabel(s.classLevel)}</td>
                            <td>{s.campaignLevel}</td>
                            <td>{s.isProctoredPaid ? "Paid" : "—"}</td>
                            <td>
                              {s.lastChallengeDate
                                ? formatWhen(s.lastChallengeDate)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selected.status === "pending" ? (
                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.verifyBtn}
                      disabled={busyId === selected.id}
                      onClick={() => void verify(selected.id, selected.institutionName)}
                    >
                      {busyId === selected.id ? "Verifying…" : "Verify this college"}
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {message ? (
            <p className={styles.message} role="status" aria-live="polite">
              {message}
            </p>
          ) : null}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
