import type { Metadata } from 'next';
import Link from 'next/link';
import { InstitutionalPage } from '@/components/layout/InstitutionalPage';
import { LOJA, linhaIdentificacao, formatarTelefone } from '@/lib/loja';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Condições de compra, pagamento, entrega e trocas da Zoliê Semijoias.',
  alternates: { canonical: '/termos' },
};

export default function TermosPage() {
  return (
    <InstitutionalPage titulo="Termos de uso e condições de venda">
      <p className="text-xs text-ink-tertiary">Última atualização: 2 de agosto de 2026</p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">1. Quem somos</h2>
      <p>
        Esta loja é operada por {linhaIdentificacao()}.
        {LOJA.email && <> Contato: <a href={`mailto:${LOJA.email}`} className="text-gold-text underline">{LOJA.email}</a>.</>}
        {LOJA.whatsapp && <> WhatsApp: {formatarTelefone(LOJA.whatsapp)}.</>}
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">2. Produtos e preços</h2>
      <p>
        Trabalhamos com semijoias em prata 925 e banho de ouro 18k. As fotos são meramente
        ilustrativas e pequenas variações de tonalidade podem ocorrer conforme a tela do
        dispositivo.
      </p>
      <p>
        Os preços são exibidos em reais e podem ser alterados sem aviso prévio. O valor
        válido é o apresentado no momento da finalização do pedido. Em caso de erro
        evidente de precificação, entraremos em contato antes de processar a compra e você
        poderá cancelar sem qualquer custo.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">3. Pagamento</h2>
      <p>
        Aceitamos cartão de crédito, Pix e boleto bancário. O processamento é feito por
        gateway de pagamento terceirizado — os dados completos do cartão não são
        armazenados em nossos servidores.
      </p>
      <p>
        Pedidos com pagamento não confirmado dentro do prazo de vencimento são cancelados
        automaticamente e os itens retornam ao estoque.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">4. Entrega</h2>
      <p>
        O prazo de entrega é informado no checkout antes da confirmação e começa a contar
        após a confirmação do pagamento, não a partir da data do pedido. Prazos de
        transportadora podem sofrer atrasos alheios à nossa gestão.
      </p>
      <p>
        É responsabilidade do cliente informar endereço completo e correto. Pedidos
        devolvidos por endereço incorreto ou ausência no recebimento podem gerar novo custo
        de frete para reenvio.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">5. Cancelamento, trocas e devoluções</h2>
      <p>
        Pedidos ainda não pagos podem ser cancelados diretamente em Meus Pedidos. Após o
        pagamento, entre em contato conosco.
      </p>
      <p>
        Você tem até 7 dias corridos após o recebimento para desistir da compra, conforme
        o art. 49 do Código de Defesa do Consumidor. Por política própria, ampliamos esse
        prazo para <strong>30 dias corridos</strong>. Detalhes e condições em{' '}
        <Link href="/trocas" className="text-gold-text underline">Trocas e devoluções</Link>.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">6. Garantia</h2>
      <p>
        Todas as peças têm garantia de 1 ano contra desgaste do banho, desde que seguidos
        os cuidados recomendados. A garantia não cobre danos por mau uso, contato com
        produtos químicos, perfume, cloro ou água do mar.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">7. Conta e responsabilidades</h2>
      <p>
        Você é responsável pela veracidade dos dados cadastrados e pela guarda da sua
        senha. É proibido usar a loja para fins ilícitos, revenda não autorizada ou
        qualquer tentativa de burlar sistemas de segurança e promoções.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">8. Cupons e promoções</h2>
      <p>
        Cupons são pessoais, não cumulativos entre si, têm prazo de validade e podem exigir
        valor mínimo de compra. Cupons de primeira compra são válidos apenas para clientes
        sem pedidos anteriores.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">9. Dados pessoais</h2>
      <p>
        O tratamento dos seus dados segue a LGPD e está detalhado na{' '}
        <Link href="/privacidade" className="text-gold-text underline">Política de privacidade</Link>.
        Você pode exportar ou excluir seus dados a qualquer momento em Minha Conta.
      </p>

      <h2 className="mt-6 font-sans text-lg font-semibold text-ink">10. Alterações e foro</h2>
      <p>
        Estes termos podem ser atualizados a qualquer momento; a versão vigente é sempre a
        publicada nesta página. Fica eleito o foro da comarca do domicílio do consumidor
        para dirimir eventuais controvérsias.
      </p>
    </InstitutionalPage>
  );
}
