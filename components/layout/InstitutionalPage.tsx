export function InstitutionalPage({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="z-eyebrow">Zoliê Semijoias</span>
        <h1 className="z-title text-4xl">{titulo}</h1>
        <span className="z-rule" />
      </div>
      <div className="z-card flex flex-col gap-4 p-7 text-[15px] font-light leading-relaxed text-ink-muted sm:p-9">
        {children}
      </div>
    </div>
  );
}
