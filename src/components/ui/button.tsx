import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg" };
export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  const variants = {
    primary: "bg-[var(--trizi-primary)] text-white hover:brightness-90 disabled:bg-slate-300",
    secondary: "border border-[var(--trizi-primary)]/25 bg-white text-[var(--trizi-primary)] hover:bg-[var(--trizi-primary)]/5",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-red-700 text-white hover:bg-red-800",
  };
  const sizes = { sm: "px-3 py-2 text-sm", md: "px-4 py-2.5", lg: "px-6 py-3.5 text-lg" };
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed", variants[variant], sizes[size], className)} {...props} />;
}
