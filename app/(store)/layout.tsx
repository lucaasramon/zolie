import { StoreShell } from '@/components/layout/StoreShell';

export const dynamic = 'force-dynamic';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
