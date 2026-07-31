'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { api, ApiError } from '@/lib/api-client';

type Tab = 'login' | 'cadastro' | 'recuperar';

interface WelcomeCoupon {
  codigo: string;
  descricao: string | null;
  tipoDesconto: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING';
  valor: number;
}

export function AuthTabs({ defaultTab }: { defaultTab: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/conta';

  const [welcomeCoupon, setWelcomeCoupon] = useState<WelcomeCoupon | null>(null);

  useEffect(() => {
    api
      .get<{ cupom: WelcomeCoupon | null }>('/coupons/welcome')
      .then(({ data }) => setWelcomeCoupon(data.cupom))
      .catch(() => {});
  }, []);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', senha: '' });
  const [cadastroForm, setCadastroForm] = useState({ nome: '', email: '', cpf: '', telefone: '', senha: '' });
  const [recuperarEmail, setRecuperarEmail] = useState('');

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.senha);
      router.push(user.role === 'ADMIN' ? '/admin/dashboard' : next);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar');
    } finally {
      setLoading(false);
    }
  }

  async function onCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await register(cadastroForm);
      router.push(next);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a conta');
    } finally {
      setLoading(false);
    }
  }

  async function onRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: recuperarEmail });
      showToast('Se o e-mail existir, enviaremos um link de recuperação.');
      setTab('login');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível enviar o link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-14">
      <div className="flex gap-6 border-b border-border-subtle">
        {(['login', 'cadastro'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setErro('');
            }}
            className={`pb-3 text-sm font-medium uppercase tracking-wider ${
              tab === t ? 'border-b-2 border-gold text-ink' : 'text-ink-tertiary'
            }`}
          >
            {t === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      {tab === 'login' && (
        <form onSubmit={onLogin} className="flex flex-col gap-4">
          <Field label="E-mail" type="email" value={loginForm.email} onChange={v => setLoginForm(f => ({ ...f, email: v }))} required />
          <Field label="Senha" type="password" value={loginForm.senha} onChange={v => setLoginForm(f => ({ ...f, senha: v }))} required />
          <button type="button" onClick={() => setTab('recuperar')} className="self-start text-xs text-gold-text hover:text-gold-text-hover">
            Esqueci minha senha
          </button>
          <button type="submit" disabled={loading} className="rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50">
            Entrar
          </button>
        </form>
      )}

      {tab === 'cadastro' && (
        <form onSubmit={onCadastro} className="flex flex-col gap-4">
          {welcomeCoupon && (
            <p className="rounded-lg bg-hoverbg px-3 py-2 text-xs text-gold-text">
              {welcomeCoupon.tipoDesconto === 'FREE_SHIPPING'
                ? `Ganhe frete grátis na primeira compra com o cupom ${welcomeCoupon.codigo}`
                : welcomeCoupon.tipoDesconto === 'PERCENT'
                  ? `Ganhe ${welcomeCoupon.valor}% off na primeira compra com o cupom ${welcomeCoupon.codigo}`
                  : `Ganhe R$ ${welcomeCoupon.valor.toFixed(2)} off na primeira compra com o cupom ${welcomeCoupon.codigo}`}
            </p>
          )}
          <Field label="Nome completo" value={cadastroForm.nome} onChange={v => setCadastroForm(f => ({ ...f, nome: v }))} required />
          <Field label="E-mail" type="email" value={cadastroForm.email} onChange={v => setCadastroForm(f => ({ ...f, email: v }))} required />
          <Field label="CPF" value={cadastroForm.cpf} onChange={v => setCadastroForm(f => ({ ...f, cpf: v }))} />
          <Field label="Celular / WhatsApp" value={cadastroForm.telefone} onChange={v => setCadastroForm(f => ({ ...f, telefone: v }))} />
          <Field label="Senha" type="password" value={cadastroForm.senha} onChange={v => setCadastroForm(f => ({ ...f, senha: v }))} required />
          <button type="submit" disabled={loading} className="rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50">
            Criar conta
          </button>
        </form>
      )}

      {tab === 'recuperar' && (
        <form onSubmit={onRecuperar} className="flex flex-col gap-4">
          <Field label="E-mail" type="email" value={recuperarEmail} onChange={setRecuperarEmail} required />
          <button type="submit" disabled={loading} className="rounded-full bg-gold py-3.5 text-xs font-medium uppercase tracking-wider text-ink hover:bg-gold-hover disabled:opacity-50">
            Enviar link
          </button>
          <button type="button" onClick={() => setTab('login')} className="text-xs text-ink-tertiary hover:text-gold-text">
            Voltar para o login
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="rounded-md border border-border-subtle px-3.5 py-2.5 outline-none transition-colors focus:border-gold"
      />
    </label>
  );
}
