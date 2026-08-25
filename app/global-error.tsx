'use client';

import { useEffect } from 'react';
import { linkWhatsApp } from '@/lib/loja';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[error] Erro global não tratado', error, { digest: error.digest });
  }, [error]);

  const whatsapp = linkWhatsApp('Olá! Encontrei um erro no site e preciso de ajuda.');

  return (
    <html lang="pt-BR">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.25rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Algo deu errado</h1>
          <p style={{ maxWidth: '28rem', fontSize: '0.875rem', color: '#666' }}>
            Não conseguimos carregar a aplicação agora. Tente novamente em instantes.
          </p>
          <button
            onClick={reset}
            style={{ borderRadius: '9999px', backgroundColor: '#d4af37', padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
          {whatsapp && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
              Se o problema continuar,{' '}
              <a href={whatsapp} target="_blank" rel="noreferrer" style={{ color: '#666', textDecoration: 'underline' }}>
                fale com a gente pelo WhatsApp
              </a>
              .
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
