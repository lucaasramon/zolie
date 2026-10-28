import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthTabs } from '@/components/auth/AuthTabs';

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthTabs defaultTab="login" />
    </Suspense>
  );
}
