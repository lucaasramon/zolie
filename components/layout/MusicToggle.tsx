'use client';

import { useRef, useState } from 'react';
import { SpeakerOnIcon, SpeakerOffIcon } from '@/components/layout/HeaderIcons';

const FAIXA_AMBIENTE = '/audio/gymnopedie-no-1.mp3';
const VOLUME_AMBIENTE = 0.35;

/**
 * Música ambiente opcional (Satie — Gymnopédie No. 1), desligada por padrão.
 * Só toca depois de um clique — navegador nenhum bloqueia autoplay nesse caso,
 * já que a ação parte de um gesto do usuário.
 */
export function MusicToggle() {
  const [tocando, setTocando] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  function alternar() {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
      setTocando(false);
      return;
    }
    audio.volume = VOLUME_AMBIENTE;
    audio
      .play()
      .then(() => setTocando(true))
      .catch(() => setTocando(false));
  }

  return (
    <>
      <audio ref={audioRef} src={FAIXA_AMBIENTE} loop preload="none" onEnded={() => setTocando(false)} />
      <button
        type="button"
        onClick={alternar}
        aria-label={tocando ? 'Pausar música ambiente' : 'Tocar música ambiente'}
        aria-pressed={tocando}
        title={tocando ? 'Pausar música ambiente' : 'Música ambiente — Satie, Gymnopédie No. 1'}
        className={`grid h-8 w-8 flex-none place-items-center rounded-full transition-colors ${
          tocando ? 'bg-gold text-ink' : 'bg-bg-alt text-ink-muted hover:bg-gold hover:text-ink'
        }`}
      >
        {tocando ? <SpeakerOnIcon className="h-[17px] w-[17px]" /> : <SpeakerOffIcon className="h-[17px] w-[17px]" />}
      </button>
    </>
  );
}
