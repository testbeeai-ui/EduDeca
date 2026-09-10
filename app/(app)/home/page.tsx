"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StartChallengeControl } from "@/components/challenge/start-challenge-control";
import { MotionFade } from "@/components/common/motion-fade";
import { LeaderboardPreview } from "@/components/home/leaderboard-preview";
import { SquadCard } from "@/components/home/squad-card";
import { leaderboardPreview } from "@/data/leaderboard";
import { buildEduDecaShareUrl } from "@/lib/referral/referral-code";
import { cn, firstNameFrom } from "@/lib/utils";
import { useAppStore, useProgressUser, useSubjectsWithProgress } from "@/store/useAppStore";

const tickerItems = [
  "Aarav from Bengaluru just hit Level 7 in Physics 🔥",
  "Diya from Pune qualified for the Metro Finals shortlist 🏆",
  "Rohan from Lucknow completed a 14-day streak ⚡",
  "Meher from Chennai jumped to Rank #312 nationally 📈",
  "Ishaan from Jaipur unlocked Level 5 in Entrepreneurship 💡",
  "Ananya from Kochi finished this week's Chemistry proctored round 🧪",
  "Vivaan from Guwahati joined 12,000+ students competing this month 🇮🇳",
];

const journeySteps = [
  {
    num: "STAGE 01",
    icon: "🎮",
    title: "Free Daily Play",
    desc: "Practice every day across your 10 disciplines, build your streak, and climb the open leaderboard — no cost, no pressure.",
    next: "Then prove it",
  },
  {
    num: "STAGE 02",
    icon: "🛡️",
    title: "Paid Proctored Rounds",
    desc: "Prove it under real exam conditions. Proctored online rounds unlock your official, verified state ranking.",
    next: "Then go live",
  },
  {
    num: "STAGE 03",
    icon: "🏆",
    title: "Metro Finals",
    desc: "Top scorers from every state are flown in to compete live, on stage, for the national EduDeca title.",
    next: "Then convert",
  },
  {
    num: "STAGE 04",
    icon: "🚀",
    title: "EduBlast Conversion",
    desc: "Your EduDeca profile, RDM balance and rank carry straight into EduBlast to power your JEE/KCET prep.",
    next: null,
  },
] as const;

function zoneProgress(level: number) {
  if (level <= 3) return { current: level, max: 3, label: "Free Zone", range: "Levels 1–3" };
  if (level <= 6) return { current: level - 3, max: 3, label: "Proctored Zone", range: "Levels 4–6" };
  return { current: Math.min(level - 6, 4), max: 4, label: "Finals Zone", range: "Levels 7–10" };
}

function useAnimatedCounter(target: number, duration: number = 1400) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return count;
}

export default function HomePage() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const userName = useAppStore((s) => s.userName);
  const referralCode = useAppStore((s) => s.referralCode);
  const progress = useProgressUser();
  const subjects = useSubjectsWithProgress();
  const [showOnboard, setShowOnboard] = useState(true);
  const [copied, setCopied] = useState(false);

  const greetingName = isSignedIn && userName ? firstNameFrom(userName) : "Student";

  const studentsCount = useAnimatedCounter(12847);
  const schoolsCount = useAnimatedCounter(410);
  const statesCount = useAnimatedCounter(28);

  const userRank = 4821;
  const zone = zoneProgress(progress.level);
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = zone.current / zone.max;
  const ringOffset = ringCircumference * (1 - ringProgress);

  const inviteUrl = () => {
    if (typeof window === "undefined") return "";
    return referralCode
      ? buildEduDecaShareUrl(window.location.origin, referralCode)
      : window.location.origin;
  };

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(inviteUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareWhatsApp = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(
        "Join me on EduDeca — India's National Academic Decathlon! Use my invite link: " +
          inviteUrl(),
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  return (
    <div className="ed-wrap space-y-4 pb-10">
      {/* ============ HERO SECTION ============ */}
      <section className="hero-section">
        <div className="hero-glow-bg" />
        <div className="hero-grid">
          <div>
            <MotionFade>
              <div className="eyebrow-badge">
                <span>🇮🇳</span> India&apos;s National Academic Decathlon
              </div>

              <h1 className="hero-h1">
                10 disciplines.
                <br />
                One <span className="hero-title-accent">champion</span> title.
              </h1>

              <p className="hero-sub-text">
                Hey {greetingName}! EduDeca pits Class XI–XII students against the country&apos;s best across
                Physics, Chemistry, a science track, a tech/business track and five core skills. Play
                free every day, prove yourself in proctored rounds, and earn your seat at the Metro
                Finals.
              </p>

              <div className="hero-ctas-row">
                <StartChallengeControl
                  className="btn-ed-primary"
                  comingSoonClassName="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-3 font-extrabold text-amber-200"
                  label={`⚡ Start Level ${progress.level} Challenge →`}
                />

                <a href="#journey" className="btn-ed-outline">
                  See how it works
                </a>
              </div>

              <div className="hero-stats-row border-t border-[#1a222c] pt-6">
                <div className="hstat">
                  <div className="hstat-num">{studentsCount.toLocaleString("en-IN")}</div>
                  <div className="hstat-label">Students competing</div>
                </div>
                <div className="hstat">
                  <div className="hstat-num">{schoolsCount.toLocaleString("en-IN")}</div>
                  <div className="hstat-label">Schools</div>
                </div>
                <div className="hstat">
                  <div className="hstat-num">{statesCount.toLocaleString("en-IN")}</div>
                  <div className="hstat-label">States & UTs</div>
                </div>
              </div>
            </MotionFade>
          </div>

          {/* Hero Right Card: Level Ring Preview Card */}
          <div>
            <MotionFade delay={0.15}>
              <div className="hero-card-box">
                <div className="hc-row">
                  <div className="level-ring-container">
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3a6" />
                          <stop offset="100%" stopColor="#3d8de0" />
                        </linearGradient>
                      </defs>
                      <circle className="level-ring-track" cx="48" cy="48" r="40" />
                      <circle
                        className="level-ring-fill"
                        cx="48"
                        cy="48"
                        r={ringRadius}
                        stroke="url(#ringGrad)"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                      />
                    </svg>
                    <div className="level-ring-label">
                      <div className="lvnum">{progress.level}</div>
                      <div className="lvtag">LEVEL</div>
                    </div>
                  </div>

                  <div>
                    <div className="hc-title">
                      Level {progress.level} · {progress.zone}
                    </div>
                    <div className="hc-zone-meta">
                      {zone.current} of {zone.max} in {zone.range}
                    </div>
                    <div className="hc-badges">
                      <span className="pill pill-gold-tag">🔥 {progress.streakDays} day streak</span>
                      <span className="pill pill-teal-tag">🥇 Rank #{userRank.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <StartChallengeControl
                  className="hc-cta"
                  comingSoonClassName="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-extrabold text-amber-100"
                  label={`⚡ Start Level ${progress.level} Challenge →`}
                />
                <div className="hc-note">
                  This is a live preview — your own ring starts at Level 1 on day one.
                </div>
              </div>
            </MotionFade>
          </div>
        </div>
      </section>

      {/* ============ ONBOARDING BANNER ============ */}
      {showOnboard && (
        <MotionFade delay={0.2}>
          <div className="onboard-box" id="onboardBanner">
            <button
              type="button"
              className="onboard-close"
              onClick={() => setShowOnboard(false)}
              aria-label="Dismiss what is EduDeca"
            >
              ✕
            </button>
            <div className="onboard-icon">👋</div>
            <div className="onboard-copy">
              <div className="onboard-title">
                New here? <span className="tag">WHAT IS EDUDECA</span>
              </div>
              <div className="onboard-text">
                <b>EduDeca</b> is EduBlast&apos;s national academic decathlon for Class XI–XII students.
                Every student competes across <b>10 disciplines</b> — Physics and Chemistry
                (mandatory), one science elective (Biology or Applied Mathematics/Biotechnology), one
                tech-or-business elective (AI &amp; CS or Entrepreneurship), and five core life skills.
                You earn levels and RDM by playing free daily rounds, then move into paid proctored
                rounds to unlock your official state rank, and the very best qualify for live Metro
                Finals. Your EduDeca profile carries straight into <b>EduBlast</b> for JEE/KCET prep.
              </div>
            </div>
          </div>
        </MotionFade>
      )}

      {/* ============ JOURNEY PIPELINE ============ */}
      <section className="ed-section" id="journey">
        <div className="section-head">
          <div>
            <div className="section-eyebrow">The path to the title</div>
            <h2 className="section-title">How EduDeca works</h2>
            <p className="section-sub">
              Four stages, one national leaderboard — from your first free round to the Metro Finals
              stage.
            </p>
          </div>
        </div>

        <div className="journey-pipeline">
          {journeySteps.map((step) => (
            <div key={step.num} className="jstep-unit">
              <article className="jstep-card">
                <div className="jstep-num">{step.num}</div>
                <div className="jstep-icon">{step.icon}</div>
                <div className="jstep-title">{step.title}</div>
                <div className="jstep-desc">{step.desc}</div>
              </article>
              {step.next ? (
                <div className="jstep-arrow" aria-hidden="true">
                  <span className="jstep-arrow-label">{step.next}</span>
                  <span className="jstep-arrow-mark">
                    <ArrowRight className="jstep-arrow-icon" />
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* ============ LIVE TICKER ============ */}
      <div className="ticker-wrap-bar rounded-xl">
        <div className="ticker-track-animate">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <span key={idx} className="ticker-item">
              <span className="ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ============ SCORECARD: 10 DISCIPLINES GRID ============ */}
      <section className="ed-section">
        <div className="section-head">
          <div>
            <div className="section-eyebrow">Your scorecard</div>
            <h2 className="section-title">Your 10 disciplines</h2>
            <p className="section-sub">
              2 mandatory subjects, 3 electives across your chosen tracks, and 5 core skills — every
              EduDeca champion masters all ten.
            </p>
          </div>
          <Link href="/levels" className="see-all">
            See all →
          </Link>
        </div>

        <div className="disc-grid">
          {subjects.map((s, idx) => {
            const roleLabel =
              idx < 2
                ? "MANDATORY"
                : idx < 5
                ? `TRACK ${String.fromCharCode(65 + idx - 2)}`
                : "CORE SKILL";

            const colorName =
              idx === 0
                ? "teal"
                : idx === 1
                ? "gold"
                : idx === 2
                ? "pink"
                : idx === 3
                ? "blue"
                : idx === 4
                ? "purple"
                : "coral";

            const progressPct = Math.round((s.level / 10) * 100);

            return (
              <div key={s.id} className={cn("disc-card-item", `c-${colorName}`)}>
                <div className="disc-top">
                  <span className="disc-chip">{roleLabel}</span>
                  <span className="disc-lv">Lv {s.level}</span>
                </div>
                <div className="disc-name">{s.name}</div>
                <div className="disc-role">{s.abbrev} · {roleLabel}</div>
                <div className="disc-bar-track">
                  <div className="disc-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ SQUAD & LEADERBOARD DASHBOARD ============ */}
      <section className="grid gap-4 lg:grid-cols-2 items-start">
        <SquadCard />
        <LeaderboardPreview entries={leaderboardPreview} />
      </section>


      {/* ============ VIRAL CTA BANNER ============ */}
      <section className="ed-section" style={{ borderTop: "none", paddingTop: 0 }}>
        <div className="viral-banner-box">
          <h2>Think you&apos;ve got what it takes?</h2>
          <p>
            12,847 students are already competing for a spot at the Metro Finals. Every day you sit out,
            someone else climbs past you.
          </p>
          <div className="viral-ctas">
            <StartChallengeControl
              className="btn-ed-primary"
              comingSoonClassName="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-3 font-extrabold text-amber-200"
              label="⚡ Start Free Challenge →"
            />
            <Link href="/leaderboard" className="btn-ed-outline">
              View Leaderboard
            </Link>
          </div>

          <div className="share-row">
            <div className="share-btn" title="Share on WhatsApp" onClick={shareWhatsApp}>
              💬
            </div>
            <div className="share-btn" title="Copy invite link" onClick={copyShareLink}>
              {copied ? "✓" : "🔗"}
            </div>
          </div>
          {copied && (
            <p className="mt-3 text-xs font-semibold text-[#22d3a6]">
              Invite link copied to clipboard!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}




