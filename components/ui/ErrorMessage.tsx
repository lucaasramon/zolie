import { linkWhatsApp } from '@/lib/loja';

interface Props {
  children: string;
  className?: string;
}

/**
 * Mensagem de erro padrão para ações da loja (checkout, conta, etc). Sempre
 * oferece o WhatsApp como saída — sem isso o cliente que esbarra num erro não
 * sabe pra onde ir além de tentar de novo.
 */
export function ErrorMessage({ children, className = 'mb-4 text-sm text-danger' }: Props) {
  const whatsapp = linkWhatsApp(`Olá! Recebi um erro no site: "${children}"`);

  return (
    <p className={className}>
      {children}
      {whatsapp && (
        <>
          {' '}
          <a href={whatsapp} target="_blank" rel="noreferrer" className="underline hover:text-danger/80">
            Falar no WhatsApp
          </a>
        </>
      )}
    </p>
  );
}
