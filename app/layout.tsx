import type { Metadata } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { CookieConsent } from "@/components/layout/CookieConsent";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DESCRICAO =
  "Semijoias em prata 925 e banho de ouro 18k — colares, brincos, anéis, pulseiras e conjuntos.";

export const metadata: Metadata = {
  // metadataBase resolve as URLs relativas de openGraph/canonical. Sem ele o
  // Next emite imagens de OG com caminho relativo, que redes sociais ignoram.
  metadataBase: new URL(APP_URL),
  title: {
    default: "Zoliê Semijoias",
    // Páginas internas definem só o próprio título; o sufixo vem daqui.
    template: "%s | Zoliê Semijoias",
  },
  description: DESCRICAO,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Zoliê Semijoias",
    title: "Zoliê Semijoias",
    description: DESCRICAO,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <AnalyticsScripts />
        {/* useSearchParams exige Suspense; sem ele a rota inteira vira dinâmica
            e perderíamos o cache conquistado no item 4. */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <AppProviders>{children}</AppProviders>
        <CookieConsent />
      </body>
    </html>
  );
}
