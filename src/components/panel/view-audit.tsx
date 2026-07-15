"use client";
import { useEffect } from "react";
export function ViewAudit({ id }: { id: string }) { useEffect(() => { fetch(`/api/submissions/${id}/view`, { method: "POST" }).catch(() => undefined); }, [id]); return null; }
