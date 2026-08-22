"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Upload,
  Send,
  CheckCircle2,
  Clock,
  Mail,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Users,
  UserCheck,
  AlertCircle,
  Copy,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import type { CollegeInviteBatch, StudentInviteRecord, DailyQuotaStatus } from "@/lib/admin/invite-types";
import { EDUDECA_PUBLIC_SIGNIN_URL, INVITE_DAILY_LIMIT } from "@/lib/admin/invite-types";
import { parseStudentCsv } from "@/lib/admin/invite-csv";
import { cn } from "@/lib/utils";
import styles from "@/components/admin/admin-console.module.css";

export function AdminInvitesView() {
  const [batches, setBatches] = useState<CollegeInviteBatch[]>([]);
  const [invites, setInvites] = useState<StudentInviteRecord[]>([]);
  const [quota, setQuota] = useState<DailyQuotaStatus>({
    dailyLimit: INVITE_DAILY_LIMIT,
    sentToday: 0,
    remainingToday: 100,
    queuedTomorrowTotal: 0,
  });

  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  // Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalCollegeName, setModalCollegeName] = useState("Vishwa College");
  const [csvRawText, setCsvRawText] = useState("");
  const [dailyQuotaInput, setDailyQuotaInput] = useState<number>(INVITE_DAILY_LIMIT);
  const [dispatching, setDispatching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchInvitesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invitations?collegeName=${encodeURIComponent(selectedCollege)}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBatches(json.batches || []);
        setInvites(json.invites || []);
        if (json.quota) setQuota(json.quota);
      }
    } catch (e) {
      console.error("Failed to load invites", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCollege]);

  useEffect(() => {
    fetchInvitesData();
  }, [fetchInvitesData]);

  // Unique College List for Dropdown
  const collegeOptions = useMemo(() => {
    const set = new Set<string>();
    batches.forEach((b) => set.add(b.collegeName));
    invites.forEach((i) => set.add(i.collegeName));
    return Array.from(set);
  }, [batches, invites]);

  // Parsed Preview inside Modal
  const parsedPreview = useMemo(() => {
    if (!csvRawText.trim()) return null;
    return parseStudentCsv(csvRawText, modalCollegeName);
  }, [csvRawText, modalCollegeName]);

  // Filtered Invites Master Table
  const filteredInvites = useMemo(() => {
    return invites.filter((inv) => {
      if (selectedCollege !== "all" && inv.collegeName !== selectedCollege) return false;
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (gradeFilter !== "all" && String(inv.classLevel) !== gradeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (inv.name || "").toLowerCase().includes(q);
        const emailMatch = inv.email.toLowerCase().includes(q);
        const codeMatch = (inv.studentCode || "").toLowerCase().includes(q);
        const collegeMatch = inv.collegeName.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !codeMatch && !collegeMatch) return false;
      }
      return true;
    });
  }, [invites, selectedCollege, statusFilter, gradeFilter, searchQuery]);

  // Overall Statistics Calculation
  const stats = useMemo(() => {
    const targetInvites = selectedCollege === "all" ? invites : invites.filter((i) => i.collegeName === selectedCollege);
    const total = targetInvites.length;
    const joined = targetInvites.filter((i) => i.status === "joined").length;
    const sent = targetInvites.filter((i) => i.status === "sent").length;
    const queued = targetInvites.filter((i) => i.status === "queued_tomorrow").length;
    const conversionPct = total > 0 ? Math.round((joined / total) * 100) : 0;
    return { total, joined, sent, queued, conversionPct };
  }, [invites, selectedCollege]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvRawText(text);
        if (file.name) {
          const guessedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          if (!modalCollegeName || modalCollegeName === "Vishwa College") {
            setModalCollegeName(guessedName);
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDispatchBatch = async () => {
    if (!parsedPreview || parsedPreview.records.length === 0) return;
    setDispatching(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeName: modalCollegeName,
          csvText: csvRawText,
          dailyLimit: dailyQuotaInput,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNotice(json.message);
        setShowUploadModal(false);
        setCsvRawText("");
        await fetchInvitesData();
      } else {
        setNotice(json.error || "Failed to dispatch batch");
      }
    } catch (err) {
      setNotice("Network error dispatching invitations");
    } finally {
      setDispatching(false);
    }
  };

  const handleDispatchQueuedTomorrow = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispatch_queued", collegeName: selectedCollege }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotice(json.message);
        await fetchInvitesData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResendSingle = async (inviteId: string, email: string) => {
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_single", inviteId }),
      });
      const json = await res.json();
      if (res.ok) {
        setNotice(`Resent invite email to ${email}`);
        await fetchInvitesData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyJoinLink = (email: string, id: string) => {
    const link = `${EDUDECA_PUBLIC_SIGNIN_URL}?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Notice Bar */}
      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a222c] pb-5">
        <div>
          <h1 className={styles.pageTitle}>College Email Invitations</h1>
          <p className={styles.pageSub}>
            Upload college rosters (CSV/Excel), dispatch branded invite emails, handle daily quota limits, and track real-time student conversions (Case A).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#212b36] bg-[#0e141b] px-3.5 py-2 text-xs font-bold text-[#eef4f2] hover:border-[#8a99a6] hover:text-[#22d3a6] transition-all"
            onClick={fetchInvitesData}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#22d3a6] via-[#10b981] to-[#3d8de0] px-4 py-2 text-xs font-extrabold text-[#04120e] shadow-md shadow-[#22d3a6]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Upload className="size-3.5" />
            Upload College CSV / Excel
          </button>
        </div>
      </div>

      {/* College Selector & Quota Banner */}
      <div className="grid gap-4 md:grid-cols-12 items-center">
        {/* College Dropdown Selector */}
        <div className="md:col-span-6 flex items-center gap-3 rounded-2xl border border-[#212b36] bg-[#0e141b] p-3">
          <Building2 className="size-5 text-[#22d3a6] shrink-0 ml-1" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5e6c78]">
              Select Institution / College
            </div>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0e141b] text-white">
                🌐 All Colleges ({collegeOptions.length})
              </option>
              {collegeOptions.map((c) => (
                <option key={c} value={c} className="bg-[#0e141b] text-white">
                  🏛️ {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Daily Quota Status Box */}
        <div className="md:col-span-6 flex items-center justify-between rounded-2xl border border-[#212b36] bg-gradient-to-r from-[#0e141b] to-[#141c25] p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#22d3a6]/15 border border-[#22d3a6]/30 text-[#22d3a6]">
              <Mail className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Daily Quota Limit</span>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-extrabold text-amber-400">
                  {quota.sentToday} / {quota.dailyLimit} Sent Today
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#8a99a6]">
                {quota.queuedTomorrowTotal > 0
                  ? `⚠️ ${quota.queuedTomorrowTotal} student emails queued for tomorrow.`
                  : `${quota.remainingToday} emails available in today's limit.`}
              </p>
            </div>
          </div>

          {quota.queuedTomorrowTotal > 0 && (
            <button
              type="button"
              onClick={handleDispatchQueuedTomorrow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-[11px] font-extrabold text-amber-300 hover:bg-amber-500/25 transition-all shrink-0"
            >
              <Send className="size-3" />
              Send Queued Now
            </button>
          )}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#212b36] bg-[#0e141b] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e6c78]">Total Uploaded</span>
            <Users className="size-4 text-[#3d8de0]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-white">{stats.total}</div>
          <div className="mt-0.5 text-[11px] text-[#8a99a6]">Students in list</div>
        </div>

        <div className="rounded-2xl border border-[#212b36] bg-[#0e141b] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e6c78]">Joined (Converted)</span>
            <UserCheck className="size-4 text-[#22d3a6]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#22d3a6]">{stats.joined}</div>
          <div className="mt-0.5 text-[11px] text-[#22d3a6] font-semibold">{stats.conversionPct}% Join Rate</div>
        </div>

        <div className="rounded-2xl border border-[#212b36] bg-[#0e141b] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e6c78]">Invites Sent</span>
            <Send className="size-4 text-[#8b7ef0]" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#eef4f2]">{stats.sent}</div>
          <div className="mt-0.5 text-[11px] text-[#8a99a6]">Emails delivered</div>
        </div>

        <div className="rounded-2xl border border-[#212b36] bg-[#0e141b] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e6c78]">Queued Tomorrow</span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-amber-400">{stats.queued}</div>
          <div className="mt-0.5 text-[11px] text-amber-400/80">Pending quota reset</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#212b36] bg-[#0e141b] p-3.5">
        <div className="flex flex-1 items-center gap-2 min-w-[220px]">
          <Search className="size-4 text-[#5e6c78] shrink-0" />
          <input
            type="text"
            placeholder="Search by student name, email, ID or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-[#5e6c78] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-[#8a99a6]">
            <Filter className="size-3.5 text-[#5e6c78]" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#212b36] bg-[#141c25] px-2.5 py-1 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="joined">🟢 Joined (Converted)</option>
              <option value="sent">🔵 Sent</option>
              <option value="queued_tomorrow">🟠 Queued for Tomorrow</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#8a99a6]">
            <span>Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="rounded-lg border border-[#212b36] bg-[#141c25] px-2.5 py-1 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              <option value="11">Class XI</option>
              <option value="12">Class XII</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Student Invitations & Conversion Table */}
      <div className="rounded-2xl border border-[#212b36] bg-[#0e141b] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#212b36] px-5 py-3.5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2">
            <span>Student Invitations Roster</span>
            <span className="rounded-full bg-[#22d3a6]/15 border border-[#22d3a6]/30 px-2 py-0.5 text-[10px] font-bold text-[#22d3a6]">
              {filteredInvites.length} records
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#212b36] bg-[#141c25]/60 text-[11px] font-bold text-[#5e6c78] uppercase tracking-wider">
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Student ID</th>
                <th className="px-5 py-3">College</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a222c]">
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8a99a6]">
                    No invitation records found matching your filters. Click <b>Upload College CSV</b> to add students.
                  </td>
                </tr>
              ) : (
                filteredInvites.map((inv) => {
                  const isJoined = inv.status === "joined";
                  const isSent = inv.status === "sent";
                  const isQueued = inv.status === "queued_tomorrow";

                  return (
                    <tr key={inv.id} className="hover:bg-[#141c25]/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white">
                        {inv.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#eef4f2]">
                        {inv.email}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#8a99a6]">
                        {inv.studentCode || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium">
                        {inv.collegeName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-[#212b36] px-2 py-0.5 font-bold text-[#8a99a6]">
                          {inv.classLevel ? `Class ${inv.classLevel === 11 ? "XI" : "XII"}` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {isJoined && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="size-3" /> Joined (Converted)
                          </span>
                        )}
                        {isSent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-400">
                            <Send className="size-3" /> Email Sent
                          </span>
                        )}
                        {isQueued && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-400" title={inv.notes || ""}>
                            <Clock className="size-3" /> Queued for Tomorrow
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => copyJoinLink(inv.email, inv.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#212b36] bg-[#141c25] px-2.5 py-1 text-[11px] font-semibold text-[#8a99a6] hover:border-[#22d3a6] hover:text-[#22d3a6] transition-colors"
                          title="Copy Student Sign-in Link"
                        >
                          {copiedId === inv.id ? <Check className="size-3 text-[#22d3a6]" /> : <Copy className="size-3" />}
                          {copiedId === inv.id ? "Copied" : "Link"}
                        </button>

                        {!isJoined && (
                          <button
                            type="button"
                            onClick={() => handleResendSingle(inv.id, inv.email)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Send className="size-3" />
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV / Excel Upload Drawer Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#212b36] bg-[#0e141b] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#212b36] pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="size-5 text-[#22d3a6]" />
                  Upload College Student Roster (CSV / Excel)
                </h3>
                <p className="text-xs text-[#8a99a6]">
                  Upload student email lists provided by colleges. Generates EduDeca invite emails and handles daily quota limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-[#8a99a6] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Institution Name */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  College / Institution Name
                </label>
                <input
                  type="text"
                  value={modalCollegeName}
                  onChange={(e) => setModalCollegeName(e.target.value)}
                  placeholder="e.g. Vishwa College"
                  className="w-full rounded-xl border border-[#212b36] bg-[#141c25] px-3.5 py-2 text-xs font-bold text-white focus:border-[#22d3a6] focus:outline-none"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Upload CSV File or Paste Roster Data
                </label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#212b36] bg-[#141c25] p-6 cursor-pointer hover:border-[#22d3a6] transition-colors">
                  <Upload className="size-6 text-[#22d3a6]" />
                  <span className="text-xs font-bold text-white">Click to browse or drop CSV / Excel file</span>
                  <span className="text-[11px] text-[#5e6c78]">Supports .csv, .txt with columns: email, name, student_id, class</span>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <label className="block text-xs font-medium text-[#8a99a6] mb-1">
                  Or Paste CSV / Email List Text Directly
                </label>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  placeholder="email, name, student_id, class&#10;ishita@vishwa.edu, Ishita Rao, VSH-101, 11&#10;rohan@vishwa.edu, Rohan Verma, VSH-102, 12"
                  className="w-full rounded-xl border border-[#212b36] bg-[#141c25] p-3 font-mono text-xs text-white placeholder-[#5e6c78] focus:border-[#22d3a6] focus:outline-none"
                />
              </div>

              {/* Daily Quota Setting */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Daily Sending Quota Limit for this Batch
                </label>
                <input
                  type="number"
                  value={dailyQuotaInput}
                  onChange={(e) => setDailyQuotaInput(Number(e.target.value))}
                  className="w-32 rounded-xl border border-[#212b36] bg-[#141c25] px-3.5 py-2 text-xs font-bold text-white focus:border-[#22d3a6] focus:outline-none"
                />
                <span className="ml-2 text-[11px] text-[#8a99a6]">Emails over this limit will queue for tomorrow</span>
              </div>

              {/* Parse Preview Table */}
              {parsedPreview && (
                <div className="rounded-xl border border-[#212b36] bg-[#141c25] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>
                      Preview: {parsedPreview.records.length} Valid Student Emails Found
                    </span>
                    <span className="text-[11px] text-[#22d3a6]">
                      {parsedPreview.xiCount} Class XI · {parsedPreview.xiiCount} Class XII
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto font-mono text-[11px]">
                    {parsedPreview.records.slice(0, 5).map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-[#212b36] text-[#8a99a6]">
                        <span>{r.name} &lt;{r.email}&gt;</span>
                        <span>{r.studentCode || "No ID"} · {r.classLevel ? `Class ${r.classLevel}` : "—"}</span>
                      </div>
                    ))}
                    {parsedPreview.records.length > 5 && (
                      <div className="pt-1 text-[#5e6c78]">... and {parsedPreview.records.length - 5} more students</div>
                    )}
                  </div>

                  {parsedPreview.errors.length > 0 && (
                    <div className="text-[11px] text-amber-400">
                      ⚠️ {parsedPreview.errors.length} rows skipped due to invalid email format.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#212b36] pt-4">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-xl border border-[#212b36] bg-transparent px-4 py-2 text-xs font-bold text-[#8a99a6] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!parsedPreview || parsedPreview.records.length === 0 || dispatching}
                onClick={handleDispatchBatch}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#22d3a6] via-[#10b981] to-[#3d8de0] px-5 py-2 text-xs font-extrabold text-[#04120e] shadow-md shadow-[#22d3a6]/20 disabled:opacity-50"
              >
                <Send className="size-3.5" />
                {dispatching ? "Dispatching..." : `⚡ Dispatch Email Invites (${parsedPreview?.records.length || 0})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
