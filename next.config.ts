import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        // `/produtos` é dinâmica (lê searchParams) e o Next responde com
        // `Cache-Control: private, no-store`, que sobrescreveria um Cache-Control
        // definido aqui. `Vercel-CDN-Cache-Control` só vale para o CDN da Vercel,
        // tem prioridade sobre o Cache-Control e o Next não o define — então
        // a listagem fica 10 min em cache e até 1 h servindo cópia antiga
        // enquanto revalida em segundo plano. O navegador continua sem cache.
        source: '/produtos',
        headers: [
          { key: 'Vercel-CDN-Cache-Control', value: 'max-age=600, stale-while-revalidate=3600' },
        ],
      },
    ];
  },
};

export default nextConfig;
