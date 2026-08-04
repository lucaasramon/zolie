const ICON_BY_SLUG: Record<string, React.ReactNode> = {
  colares: (
    <>
      <path d="M12 3c-3 0-5.5 2.2-5.5 5 0 3.5 2.5 6 5.5 10 3-4 5.5-6.5 5.5-10 0-2.8-2.5-5-5.5-5Z" />
      <circle cx="12" cy="8" r="1.6" />
    </>
  ),
  brincos: (
    <>
      <path d="M12 3v3" />
      <circle cx="12" cy="8" r="2" />
      <path d="M9.5 10c-1 1.5-1.5 3-1.5 4.5a4 4 0 0 0 8 0c0-1.5-.5-3-1.5-4.5" />
    </>
  ),
  aneis: (
    <>
      <circle cx="12" cy="14" r="6" />
      <path d="M9.3 8.2 12 4l2.7 4.2" />
      <path d="M12 4v4" />
    </>
  ),
  pulseiras: (
    <>
      <ellipse cx="12" cy="12" rx="8" ry="5.5" />
      <ellipse cx="12" cy="12" rx="4.3" ry="2.8" />
    </>
  ),
  conjuntos: (
    <>
      <path d="M12 3.5c-2.6 0-4.8 1.9-4.8 4.3 0 3 2.2 5.2 4.8 8.7 2.6-3.5 4.8-5.7 4.8-8.7 0-2.4-2.2-4.3-4.8-4.3Z" />
      <circle cx="6" cy="18.5" r="1.8" />
      <circle cx="18" cy="18.5" r="1.8" />
    </>
  ),
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const paths = ICON_BY_SLUG[slug];
  if (!paths) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
