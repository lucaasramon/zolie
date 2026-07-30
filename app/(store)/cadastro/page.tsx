import { Suspense } from 'react';
import { AuthTabs } from '@/components/auth/AuthTabs';

export default function CadastroPage() {
  return (
    <Suspense>
      <AuthTabs defaultTab="cadastro" />
    </Suspense>
  );
}
