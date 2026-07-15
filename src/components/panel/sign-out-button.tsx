"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
export function SignOutButton({ compact = false }: { compact?: boolean }) { const [loading, setLoading] = useState(false); const router = useRouter(); async function signOut() { setLoading(true); await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); } return <Button variant="ghost" size="sm" onClick={signOut} disabled={loading} className={compact ? "w-10 px-0" : "w-full justify-start"}><LogOut size={18} />{!compact && (loading ? "Saindo..." : "Sair")}</Button>; }
