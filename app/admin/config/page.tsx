import { env } from '@/lib/env';
import { brl } from '@/lib/utils/money';

export default function AdminConfigPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Regras de venda</h2>
        <p className="text-xs text-ink-tertiary">Estes valores são definidos por variáveis de ambiente do servidor (.env) e exibidos aqui somente para consulta.</p>
        <Row label="Frete grátis a partir de" value={brl(env.business.freeShippingThreshold)} />
        <Row label="Desconto no Pix" value={`${env.business.pixDiscountPercent}%`} />
        <Row label="Máximo de parcelas" value={`${env.business.maxInstallments}x`} />
        <Row label="Alerta de estoque baixo" value="8 unidades" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
        <h2 className="font-sans text-lg font-semibold text-ink">Dados da loja</h2>
        <p className="text-xs text-ink-tertiary">Dados institucionais exibidos no rodapé e páginas legais do site.</p>
        <Row label="Razão social" value="Zoliê Semijoias LTDA" />
        <Row label="CNPJ" value="00.000.000/0001-00" />
        <Row label="WhatsApp" value="(11) 90000-0000" />
        <Row label="E-mail de atendimento" value="atendimento@zolie.com.br" />
        <Row label="Instagram" value="@zoliesemijoias" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-sm first:border-0 first:pt-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
