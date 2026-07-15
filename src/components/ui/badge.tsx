import { cn } from "@/lib/utils";
export function Badge({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info"; className?: string }) {
  const tones = { neutral: "bg-slate-100 text-slate-700", success: "bg-emerald-100 text-emerald-800", warning: "bg-amber-100 text-amber-900", danger: "bg-red-100 text-red-800", info: "bg-blue-100 text-blue-800" };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)}>{children}</span>;
}
