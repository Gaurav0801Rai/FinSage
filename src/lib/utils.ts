import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class merger — used everywhere */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format currency in INR by default (matches market focus) */
export function formatINR(value: number, compact = false): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: compact && Math.abs(value) >= 100000 ? 1 : 2,
    notation: compact && Math.abs(value) >= 100000 ? "compact" : "standard",
  }).format(value);
}

/** Format percentage with sign */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format a number compactly: 1.2K, 3.4M, 5.6Cr */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Returns "gain", "loss", or "neutral" — used for color theming */
export function getDirection(value: number): "gain" | "loss" | "neutral" {
  if (value > 0) return "gain";
  if (value < 0) return "loss";
  return "neutral";
}

/** Sleep helper for retries */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));