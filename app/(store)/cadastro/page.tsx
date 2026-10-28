import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthTabs } from '@/components/auth/AuthTabs';

export const metadata: Metadata = {
  title: 'Criar conta',
  robots: { index: false, follow: false },
};

export default function CadastroPage() {
  return (
    <Suspense>
      <AuthTabs defaultTab="cadastro" />
    </Suspense>
  );
}
