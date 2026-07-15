"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm" role="alert">
      <AlertTriangle className="mx-auto text-red-600" size={42} />
      <h1 className="mt-4 text-2xl font-semibold">Não foi possível carregar esta área</h1>
      <p className="mt-2 text-slate-600">Nenhuma informação foi alterada. Tente novamente ou retorne ao painel.</p>
      <Button className="mt-6" onClick={reset}><RotateCcw size={18} />Tentar novamente</Button>
    </div>
  );
}
