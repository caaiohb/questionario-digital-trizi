import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHmac } from "node:crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function hmac(value: string, secret?: string): string {
  const resolvedSecret = secret ?? process.env.AUDIT_HASH_SECRET ?? process.env.RATE_LIMIT_SECRET;
  if (!resolvedSecret && process.env.NODE_ENV === "production") {
    throw new Error("Segredo HMAC obrigatório não configurado.");
  }
  return createHmac("sha256", resolvedSecret ?? "development-only").update(value).digest("hex");
}

export function getRequestIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) throw new Error("Origem inválida.");
  const originHost = new URL(origin).host;
  if (originHost !== host) throw new Error("Origem inválida.");
}

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  const deployment = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (deployment) return `https://${deployment}`;
  return "http://localhost:3000";
}

export function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
