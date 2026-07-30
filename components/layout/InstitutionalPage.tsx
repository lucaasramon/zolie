export function InstitutionalPage({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="mb-6 font-sans text-3xl font-semibold text-ink">{titulo}</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-ink-muted">{children}</div>
    </div>
  );
}
