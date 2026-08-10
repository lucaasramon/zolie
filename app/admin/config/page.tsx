import { env } from '@/lib/env';
import { brl } from '@/lib/utils/money';
import { formatarCnpj, formatarTelefone } from '@/lib/loja';
import * as siteConfig from '@/lib/services/site-config.service';
import { SiteConfigToggles } from '@/components/admin/SiteConfigToggles';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  await siteConfig.preparar();
  const config = siteConfig.get();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SiteConfigToggles config={config} />

      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Regras de venda</h2>
        <p className="text-xs text-ink-tertiary">Estes valores são definidos por variáveis de ambiente do servidor (.env) e exibidos aqui somente para consulta.</p>
        <Row label="Valor mínimo p/ frete grátis (quando ativo)" value={brl(env.business.freeShippingThreshold)} />
        <Row label="Percentual de desconto no Pix (quando ativo)" value={`${env.business.pixDiscountPercent}%`} />
        <Row label="Máximo de parcelas" value={`${env.business.maxInstallments}x`} />
        <Row label="Alerta de estoque baixo" value="3 unidades por variação" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Dados da loja</h2>
        <p className="text-xs text-ink-tertiary">
          Exibidos no rodapé e nas páginas legais. Definidos por variáveis de ambiente
          (<code>LOJA_*</code> e <code>NEXT_PUBLIC_LOJA_*</code>).
        </p>
        <Row label="Razão social" value={env.loja.razaoSocial} />
        <Row label="CNPJ" value={env.loja.cnpj ? formatarCnpj(env.loja.cnpj) : ''} />
        <Row label="Endereço" value={env.loja.endereco} />
        <Row label="WhatsApp" value={env.loja.whatsapp ? formatarTelefone(env.loja.whatsapp) : ''} />
        <Row label="E-mail de atendimento" value={env.loja.emailContato} />
        <Row label="Instagram" value={env.loja.instagram} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-2 text-sm first:border-0 first:pt-0">
      <span className="flex-none text-ink-muted">{label}</span>
      {value ? (
        <span className="text-right font-medium text-ink">{value}</span>
      ) : (
        // Campo vazio precisa aparecer como pendência: exibir placeholder daria a
        // impressão de que o dado legal já está publicado no site.
        <span className="text-right text-xs text-danger">não configurado</span>
      )}
    </div>
  );
}
