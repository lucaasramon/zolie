'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

interface Config {
  freteGratisAtivo: boolean;
  descontoPixAtivo: boolean;
}

export function SiteConfigToggles({ config }: { config: Config }) {
  const [current, setCurrent] = useState(config);
  const [saving, setSaving] = useState<keyof Config | null>(null);

  async function toggle(campo: keyof Config) {
    const valor = !current[campo];
    setSaving(campo);
    try {
      await api.patch<Config>('/admin/site-config', { [campo]: valor });
      setCurrent(c => ({ ...c, [campo]: valor }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-xs">
      <div>
        <h2 className="font-sans text-lg font-semibold text-ink">Promoções ativas</h2>
        <p className="text-xs text-ink-tertiary">Ligue ou desligue essas vantagens a qualquer momento, sem precisar de deploy.</p>
      </div>
      <Toggle
        label="Frete grátis acima do valor mínimo"
        ativo={current.freteGratisAtivo}
        saving={saving === 'freteGratisAtivo'}
        onClick={() => toggle('freteGratisAtivo')}
      />
      <Toggle
        label="Desconto no pagamento via Pix"
        ativo={current.descontoPixAtivo}
        saving={saving === 'descontoPixAtivo'}
        onClick={() => toggle('descontoPixAtivo')}
      />
    </div>
  );
}

function Toggle({ label, ativo, saving, onClick }: { label: string; ativo: boolean; saving: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-3 first:border-0 first:pt-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className={`relative h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-60 ${
          ativo ? 'bg-gold' : 'bg-hoverbg'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            ativo ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
