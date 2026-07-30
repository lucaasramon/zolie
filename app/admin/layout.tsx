import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { me } from '@/lib/services/auth.service';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login?next=/admin');

  const user = await me(session.sub);

  return (
    <div className="flex min-h-screen bg-bg">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader titulo="Painel administrativo" nome={user.nome} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
