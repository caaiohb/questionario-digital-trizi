export function InstituteLogo({ logoUrl, institutionName, compact = false }: { logoUrl?: string | null; institutionName: string; compact?: boolean }) {
  if (logoUrl) {
    return (
      // A URL é configurada pelo administrador e pode vir de qualquer CDN HTTPS autorizada pela CSP.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`Logo ${institutionName}`}
        width={compact ? 120 : 180}
        height={compact ? 48 : 72}
        className="h-auto max-h-16 w-auto object-contain"
      />
    );
  }
  return <div className="flex items-center gap-3" aria-label={institutionName}><div className={`${compact ? "h-9 w-9" : "h-12 w-12"} grid place-items-center rounded-2xl bg-[var(--trizi-primary)] font-serif text-xl font-bold text-white`}>T</div><div><div className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--trizi-primary)]">Instituto</div><div className={`${compact ? "text-lg" : "text-2xl"} font-semibold text-[var(--trizi-primary)]`}>Trizi</div></div></div>;
}
