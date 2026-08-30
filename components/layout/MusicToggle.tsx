'use client';

import { useEffect, useRef, useState } from 'react';
import { SpeakerOnIcon, SpeakerOffIcon } from '@/components/layout/HeaderIcons';

const FAIXA_AMBIENTE = '/audio/gymnopedie-no-1.mp3';
const VOLUME_AMBIENTE = 0.35;
const DICA_DURACAO_MS = 6000;

/**
 * Música ambiente (Satie — Gymnopédie No. 1), tocando por padrão.
 * A maioria dos navegadores bloqueia autoplay com som sem gesto prévio do
 * usuário: tentamos tocar assim que a página carrega e, se for bloqueado,
 * caímos para o primeiro clique/toque/tecla em qualquer lugar da página.
 */
export function MusicToggle() {
  const [tocando, setTocando] = useState(false);
  const [mostrarDica, setMostrarDica] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  function iniciar() {
    const audio = audioRef.current;
    if (!audio || tocando) return;
    audio.volume = VOLUME_AMBIENTE;
    audio
      .play()
      .then(() => {
        setTocando(true);
        setMostrarDica(true);
      })
      .catch(() => {});
  }

  useEffect(() => {
    iniciar();

    const eventos: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    function onGesto() {
      iniciar();
    }
    eventos.forEach(evento => window.addEventListener(evento, onGesto, { once: true }));
    return () => {
      eventos.forEach(evento => window.removeEventListener(evento, onGesto));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mostrarDica) return;
    const timer = setTimeout(() => setMostrarDica(false), DICA_DURACAO_MS);
    return () => clearTimeout(timer);
  }, [mostrarDica]);

  function alternar() {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
      setTocando(false);
      setMostrarDica(false);
      return;
    }
    iniciar();
  }

  return (
    <div className="relative">
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

      {mostrarDica && (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-max max-w-[220px] animate-zfade rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg"
        >
          <span className="absolute -top-1.5 right-2.5 h-3 w-3 rotate-45 bg-ink" aria-hidden="true" />
          <div className="flex items-start gap-2">
            <span>🎵 Música ambiente tocando. Clique aqui para pausar.</span>
            <button
              type="button"
              onClick={() => setMostrarDica(false)}
              aria-label="Fechar aviso"
              className="flex-none text-white/70 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
