'use client';

import { createContext, useContext, useState } from 'react';

interface AdminMobileNavContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AdminMobileNavContext = createContext<AdminMobileNavContextValue | null>(null);

export function useAdminMobileNav() {
  const ctx = useContext(AdminMobileNavContext);
  if (!ctx) throw new Error('useAdminMobileNav deve ser usado dentro de AdminMobileNavProvider');
  return ctx;
}

export function AdminMobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <AdminMobileNavContext.Provider value={{ open, setOpen }}>{children}</AdminMobileNavContext.Provider>;
}
