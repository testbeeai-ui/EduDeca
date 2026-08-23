"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "@/components/college/college-portal.module.css";
import { supabase } from "@/lib/supabase/client";
import { initialsFromName } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

type PortalStudent = {
  userId: string;
  name: string;
  roll: string;
  cls: string;
  track: string;
  level: number;
  score: number | null;
  fees: boolean;
  status: "active" | "inactive" | string;
  last: string;
  comment: string;
};

type PortalPayload = {
  college: {
    institutionName: string;
    city: string;
    state: string;
    principalName: string;
    contactName: string;
    registeredAt: string;
    verifiedAt: string | null;
    pledge: boolean;
  };
  stats: {
    totalStudents: number;
    classXi: number;
    classXii: number;
    feesPaidPct: number;
    avgLevel: number;
  };
  students: PortalStudent[];
};

type FilterChip = "all" | "xi" | "xii" | "fees";

function levelTier(level: number): "low" | "mid" | "high" | "top" {
  if (level <= 2) return "low";
  if (level <= 4) return "mid";
  if (level <= 6) return "high";
  return "top";
}

const LEVEL_COLOR = {
  low: "var(--cr-muted-dim)",
  mid: "var(--cr-blue)",
  high: "var(--cr-purple)",
  top: "var(--cr-teal)",
} as const;

function scoreColor(p: number): string {
  if (p >= 80) return "var(--cr-teal)";
  if (p >= 60) return "var(--cr-blue)";
  if (p >= 40) return "var(--cr-amber)";
  return "var(--cr-red)";
}

function formatRegistered(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function CollegePortalView() {
  const signOut = useAppStore((s) => s.signOut);
  const userName = useAppStore((s) => s.userName);
  const email = useAppStore((s) => s.email);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const [data, setData] = useState<PortalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterChip>("all");
  const [comments, setComments] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure cookie session is warm before the server route reads auth.
      await supabase.auth.getSession();
      const res = await fetch("/api/college/portal", { credentials: "include" });
      const json = (await res.json()) as PortalPayload & {
        error?: string;
        status?: string;
      };
      if (!res.ok) {
        if (res.status === 401) {
          setError(
            "Sign in with the same Google account used for college registration to open the portal.",
          );
        } else if (res.status === 403) {
          setError(
            json.status === "pending"
              ? "Your college is still pending verification. You’ll get portal access once an admin verifies you."
              : json.error || "This account is not allowed to open the college portal.",
          );
        } else if (res.status === 404) {
          setError(
            "No college registration found for this Google account. Register at College sign-in first.",
          );
        } else {
          setError(json.error || "Could not load college portal");
        }
        setData(null);
        return;
      }
      setData(json);
      const seed: Record<string, string> = {};
      for (const s of json.students) seed[s.userId] = s.comment ?? "";
      setComments(seed);
    } catch {
      setError("Could not load college portal");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isSignedIn) {
      setLoading(false);
      setError(
        "Sign in with the same Google account used for college registration to open the portal.",
      );
      setData(null);
      return;
    }
    void load();
  }, [hasHydrated, isSignedIn, load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.students.filter((s) => {
      if (filter === "xi" && s.cls !== "XI") return false;
      if (filter === "xii" && s.cls !== "XII") return false;
      if (filter === "fees" && s.fees) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q)
      );
    });
  }, [data, filter, query]);

  const handleSignOut = async () => {
    signOut();
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/college/signin";
  };

  const exportCsv = () => {
    if (!data) return;
    const header = [
      "Name",
      "Roll",
      "Class",
      "Track",
      "Level",
      "Score",
      "FeesPaid",
      "Status",
      "LastActive",
      "Comment",
    ];
    const rows = filtered.map((s) =>
      [
        s.name,
        s.roll,
        s.cls,
        s.track,
        String(s.level),
        String(s.score ?? ""),
        s.fees ? "Y" : "N",
        s.status,
        s.last,
        comments[s.userId] ?? "",
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.college.institutionName.replace(/\s+/g, "_")}_students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = userName || email || "Coordinator";
  const initials = initialsFromName(displayName);

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.wrap}>
          <p className={styles.loading}>Loading college portal…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.root}>
        <div className={styles.wrap}>
          <p className={styles.error}>{error || "Portal unavailable"}</p>
          <div className={styles.errorActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => void load()}>
              Retry
            </button>
            <a className={styles.ghostBtn} href="/college/signin">
              College sign-in
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { college, stats } = data;

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.mark}>ED</div>
          <div className={styles.wordmark}>
            EduDeca <span>· College Portal</span>
          </div>
        </div>
        <div className={styles.topbarRight}>
          <div className={styles.signedIn}>
            <div className={styles.av}>{initials}</div>
            {displayName} (Coordinator)
          </div>
          <button type="button" className={styles.logoutBtn} onClick={() => void handleSignOut()}>
            ↪ Sign Out
          </button>
        </div>
      </header>

      <div className={styles.wrap}>
        <div className={styles.collegeCard}>
          <div className={styles.collegeId}>
            <div className={styles.collegeLogo}>🏫</div>
            <div>
              <div className={styles.collegeName}>{college.institutionName}</div>
              <div className={styles.collegeMeta}>
                {college.city}, {college.state} · Principal: <b>{college.principalName}</b> ·
                Registered {formatRegistered(college.registeredAt)}
              </div>
            </div>
          </div>
          <span className={styles.statusPill}>
            {college.pledge ? "✓ Proctoring pledge signed" : "Pledge incomplete"}
          </span>
        </div>

        <div className={styles.statStrip}>
          <div className={styles.statBox}>
            <div className={styles.statIc} style={{ background: "rgba(79,163,232,.12)", color: "var(--cr-blue)" }}>
              🎓
            </div>
            <div className={styles.statVal}>{stats.totalStudents}</div>
            <div className={styles.statLbl}>Total Students</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIc} style={{ background: "rgba(79,163,232,.12)", color: "var(--cr-blue)" }}>
              XI
            </div>
            <div className={styles.statVal}>{stats.classXi}</div>
            <div className={styles.statLbl}>Class XI Enrolled</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIc} style={{ background: "rgba(154,140,242,.12)", color: "var(--cr-purple)" }}>
              XII
            </div>
            <div className={styles.statVal}>{stats.classXii}</div>
            <div className={styles.statLbl}>Class XII Enrolled</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIc} style={{ background: "rgba(34,211,166,.12)", color: "var(--cr-teal)" }}>
              ₹
            </div>
            <div className={styles.statVal}>{stats.feesPaidPct}%</div>
            <div className={styles.statLbl}>Fees Paid (L4–6)</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIc} style={{ background: "rgba(242,180,65,.12)", color: "var(--cr-amber)" }}>
              ⌀
            </div>
            <div className={styles.statVal}>{stats.avgLevel}</div>
            <div className={styles.statLbl}>Avg. Level Attained</div>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.searchBox}>
            <span aria-hidden>🔍</span>
            <label className={styles.srOnly} htmlFor="college-student-search">
              Search students
            </label>
            <input
              id="college-student-search"
              type="text"
              placeholder="Search by student name or roll number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {(
            [
              ["all", "All students"],
              ["xi", "Class XI"],
              ["xii", "Class XII"],
              ["fees", "Fees pending"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${styles.filterChip} ${filter === id ? styles.filterChipActive : ""}`}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
          <button type="button" className={styles.ghostBtn} disabled title="Coming soon">
            ⬆ Upload data
          </button>
          <button type="button" className={styles.primaryBtn} onClick={exportCsv}>
            ⬇ Export CSV
          </button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table aria-label="College students">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Track</th>
                  <th>Level Attained</th>
                  <th>Prev. Level Score</th>
                  <th>Fees Paid (L4–6)</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th style={{ minWidth: 180 }}>Comments</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.emptyRow}>
                      No students matched yet. When students sign in with this college name on their
                      profile, they appear here.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const tier = levelTier(s.level);
                    return (
                      <tr key={s.userId}>
                        <td>
                          <div className={styles.stuName}>{s.name}</div>
                          <div className={styles.stuRoll}>{s.roll}</div>
                        </td>
                        <td>
                          <span
                            className={`${styles.classPill} ${
                              s.cls === "XII" ? styles.classXii : styles.classXi
                            }`}
                          >
                            {s.cls}
                          </span>
                        </td>
                        <td>{s.track}</td>
                        <td>
                          <span className={styles.levelBadge}>
                            <span
                              className={styles.levelDot}
                              style={{ background: LEVEL_COLOR[tier] }}
                            />
                            Level {s.level}
                          </span>
                        </td>
                        <td>
                          {s.score == null ? (
                            <span className={styles.scoreTxt} style={{ color: "var(--cr-muted-dim)" }}>
                              —
                            </span>
                          ) : (
                            <div className={styles.scoreCell}>
                              <div className={styles.scoreTrack}>
                                <div
                                  className={styles.scoreFill}
                                  style={{
                                    width: `${s.score}%`,
                                    background: scoreColor(s.score),
                                  }}
                                />
                              </div>
                              <span className={styles.scoreTxt}>{s.score}%</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`${styles.feesPill} ${s.fees ? styles.feesYes : styles.feesNo}`}
                            aria-label={s.fees ? "Fees paid" : "Fees pending"}
                          >
                            {s.fees ? "Y" : "N"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.statusDotRow}>
                            <span
                              className={styles.statusDot}
                              style={{
                                background:
                                  s.status === "active"
                                    ? "var(--cr-teal)"
                                    : "var(--cr-muted-dim)",
                              }}
                            />
                            {s.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ color: "var(--cr-muted)", fontSize: 12 }}>{s.last}</td>
                        <td className={styles.commentCell}>
                          <input
                            type="text"
                            aria-label={`Comment for ${s.name}`}
                            placeholder="Add a comment..."
                            value={comments[s.userId] ?? ""}
                            onChange={(e) =>
                              setComments((prev) => ({
                                ...prev,
                                [s.userId]: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFoot}>
            <span>
              Showing <b>{filtered.length}</b> of <b>{data.students.length}</b> students
            </span>
            <span>Matched by institution name from student EduDeca profiles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
