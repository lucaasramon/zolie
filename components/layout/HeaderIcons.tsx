type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}

export function HeartIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base} fill={filled ? 'currentColor' : 'none'} className={className} aria-hidden="true">
      <path d="M12 20.2c-4.9-3.2-9-6.7-9-11A5 5 0 0 1 12 6.5 5 5 0 0 1 21 9.2c0 4.3-4.1 7.8-9 11Z" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6.5 8h11l1 12.5h-13L6.5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M11.5 3.5h5.8a1.2 1.2 0 0 1 1.2 1.2v5.8a1.2 1.2 0 0 1-.35.85l-8.5 8.5a1.2 1.2 0 0 1-1.7 0l-5.5-5.5a1.2 1.2 0 0 1 0-1.7l8.5-8.5a1.2 1.2 0 0 1 .85-.35Z" />
      <circle cx="15" cy="8" r="1.3" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}
