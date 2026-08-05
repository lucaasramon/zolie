'use client';

import { useAdminMobileNav } from '@/components/admin/AdminMobileNav';

export function AdminSidebarShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useAdminMobileNav();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[232px] flex-none transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </div>
    </>
  );
}
