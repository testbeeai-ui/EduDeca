"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Zap, Flame, Trophy, ShieldAlert, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "challenge" | "streak" | "rank" | "proctored" | "news";
  read: boolean;
  link?: string;
}

export function NotificationIcon({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-xl border-border/60 bg-card/50 hover:bg-card hover:border-[#22d3a6]/50 transition-colors",
          isOpen && "border-[#22d3a6] text-[#22d3a6]",
          className
        )}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-black ring-2 ring-[#0b1219]">
            {unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            data-lenis-prevent
            className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-sm rounded-2xl border border-[#212b36] bg-[#0e141b] p-4 shadow-2xl shadow-black/90 z-[100] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-[#212b36] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#22d3a6]/15 border border-[#22d3a6]/30 px-2 py-0.5 text-[10px] font-bold text-[#22d3a6]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#8a99a6] hover:text-[#22d3a6] transition-colors"
                  >
                    <CheckCheck className="size-3.5" /> Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[#8a99a6] hover:text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="space-y-2.5 max-h-[300px] overflow-y-auto overscroll-contain pr-1 dark-scrollbar"
            >
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8a99a6]">No notifications right now</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      "group relative flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer",
                      n.read
                        ? "border-transparent bg-white/[0.02] opacity-70 hover:opacity-100"
                        : "border-[#22d3a6]/20 bg-[#22d3a6]/[0.04] hover:border-[#22d3a6]/40"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-sm border",
                        n.type === "challenge" && "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
                        n.type === "streak" && "bg-amber-500/15 border-amber-500/30 text-amber-400",
                        n.type === "rank" && "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
                        n.type === "proctored" && "bg-purple-500/15 border-purple-500/30 text-purple-400",
                        n.type === "news" && "bg-blue-500/15 border-blue-500/30 text-blue-400"
                      )}
                    >
                      {n.type === "challenge" && <Zap className="size-4" />}
                      {n.type === "streak" && <Flame className="size-4" />}
                      {n.type === "rank" && <Trophy className="size-4" />}
                      {n.type === "proctored" && <ShieldAlert className="size-4" />}
                      {n.type === "news" && <Sparkles className="size-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-white text-xs truncate">{n.title}</p>
                        <span className="text-[10px] text-[#5e6c78] shrink-0">{n.time}</span>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-snug text-[#8a99a6] line-clamp-2">{n.message}</p>

                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setIsOpen(false)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#22d3a6] hover:underline"
                        >
                          View details →
                        </Link>
                      )}
                    </div>

                    {!n.read && (
                      <span className="absolute top-3 right-3 size-2 rounded-full bg-[#22d3a6] ring-4 ring-[#0e141b]" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

