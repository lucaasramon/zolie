'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminMobileNav } from '@/components/admin/AdminMobileNav';

interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

export function AdminSidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { setOpen } = useAdminMobileNav();

  return (
    <>
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
              active ? 'bg-adminbg-active text-gold' : 'text-[#E3DBCC] hover:bg-adminbg-active hover:text-white'
            }`}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-medium text-ink">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}
