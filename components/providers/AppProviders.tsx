'use client';

import { ToastProvider } from '@/components/providers/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { WishlistProvider } from '@/components/providers/WishlistProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
