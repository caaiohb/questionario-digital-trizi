import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[var(--trizi-primary)]", className)} {...props} />);
Input.displayName = "Input";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => <textarea ref={ref} className={cn("min-h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[var(--trizi-primary)]", className)} {...props} />);
Textarea.displayName = "Textarea";
