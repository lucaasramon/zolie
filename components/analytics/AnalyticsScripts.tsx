'use client';

import Script from 'next/script';
import { GA_ID, META_PIXEL_ID } from '@/lib/analytics';

/**
 * Carrega GA4 e Meta Pixel. Cada bloco só é emitido se o respectivo ID estiver
 * configurado, então em dev nada é carregado e nenhum dado de teste polui os
 * relatórios de produção.
 *
 * `afterInteractive` mantém os scripts fora do caminho crítico de renderização —
 * relevante porque a página de produto agora é servida do cache (ver item 4).
 */
export function AnalyticsScripts() {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              // Consent Mode com padrão negado (LGPD): o consentimento é aplicado
              // depois, pelo banner, e precisa vir ANTES de qualquer config.
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              try {
                if (localStorage.getItem('zolie_cookie_consent') === 'granted') {
                  gtag('consent', 'update', {
                    analytics_storage: 'granted',
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                  });
                }
              } catch (e) {}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {META_PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              // Revoga antes do init: sem isso o Pixel dispararia PageView na
              // carga, antes de o usuário decidir sobre os cookies.
              var consentido = false;
              try { consentido = localStorage.getItem('zolie_cookie_consent') === 'granted'; } catch (e) {}
              fbq('consent', consentido ? 'grant' : 'revoke');
              fbq('init', '${META_PIXEL_ID}');
              if (consentido) fbq('track', 'PageView');
            `}
          </Script>
          {/* O fallback <noscript> do Pixel foi omitido de propósito: ele dispara
              PageView incondicionalmente, sem como respeitar o consentimento. */}
        </>
      )}
    </>
  );
}
