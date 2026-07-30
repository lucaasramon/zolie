import { Suspense } from 'react';
import { AuthTabs } from '@/components/auth/AuthTabs';

export default function LoginPage() {
  return (
    <Suspense>
      <AuthTabs defaultTab="login" />
    </Suspense>
  );
}
