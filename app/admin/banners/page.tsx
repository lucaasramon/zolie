import { list } from '@/lib/services/banner.service';
import { BannerManager } from '@/components/admin/BannerManager';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await list();
  const serialized = banners.map(b => ({
    id: b.id,
    titulo: b.titulo,
    subtitulo: b.subtitulo,
    tag: b.tag,
    cta: b.cta,
    link: b.link,
    ordem: b.ordem,
    ativo: b.ativo,
  }));
  return <BannerManager banners={serialized} />;
}
