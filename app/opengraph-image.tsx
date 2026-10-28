import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Prévia padrão de links (WhatsApp, Instagram, Facebook, Google Discover) para
// toda página que não define a própria imagem — produto usa a foto da peça.
export const alt = 'Zoliê Semijoias — semijoias em prata 925 e banho de ouro 18k';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/images/zolie-logo-transparent.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Mesmo taupe do logo oficial (public/images/zolie-logo.png): o logo é branco.
          background: '#ABA096',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={340} height={340} alt="" />
        <div style={{ width: 120, height: 1, background: '#FFFFFF', marginTop: 4, marginBottom: 26, opacity: 0.8 }} />
        <div style={{ fontSize: 40, color: '#FFFFFF', letterSpacing: 1 }}>
          Semijoias em prata 925 e banho de ouro 18k
        </div>
        <div style={{ fontSize: 26, color: '#FFFFFF', opacity: 0.85, marginTop: 14, letterSpacing: 3 }}>
          zolieoficial.com.br
        </div>
      </div>
    ),
    size,
  );
}
