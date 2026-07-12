import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXp(value: number): string {
  return value.toLocaleString("en-IN");
}

export function firstNameFrom(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Student";
  return trimmed.split(/\s+/)[0] ?? "Student";
}

export function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
