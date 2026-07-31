'use client';

declare global {
  interface Window {
    Asaas?: {
      tokenizeCreditCard: (payload: {
        customer: string;
        creditCard: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string };
        creditCardHolderInfo: {
          name: string;
          email: string;
          cpfCnpj: string;
          postalCode: string;
          addressNumber: string;
          addressComplement?: string;
          phone?: string;
        };
      }) => Promise<{ creditCardToken: string }>;
    };
  }
}

const SCRIPT_SRC = process.env.NEXT_PUBLIC_ASAAS_SANDBOX === 'false' ? 'https://assets.asaas.com/pay/js/index.js' : 'https://sandbox.assets.asaas.com/pay/js/index.js';

let loadPromise: Promise<void> | null = null;

export function loadAsaasJs(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Asaas) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Não foi possível carregar o Asaas.js'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function tokenizeCard(input: {
  customerId: string;
  cartao: { numero: string; nomeImpresso: string; validadeMes: string; validadeAno: string; cvv: string };
  titular: { nome: string; email: string; cpf: string; cep: string; numero: string; complemento?: string; telefone?: string };
}): Promise<string> {
  await loadAsaasJs();
  if (!window.Asaas) throw new Error('Asaas.js indisponível');

  const { creditCardToken } = await window.Asaas.tokenizeCreditCard({
    customer: input.customerId,
    creditCard: {
      holderName: input.cartao.nomeImpresso,
      number: input.cartao.numero.replace(/\s/g, ''),
      expiryMonth: input.cartao.validadeMes,
      expiryYear: input.cartao.validadeAno,
      ccv: input.cartao.cvv,
    },
    creditCardHolderInfo: {
      name: input.titular.nome,
      email: input.titular.email,
      cpfCnpj: input.titular.cpf.replace(/\D/g, ''),
      postalCode: input.titular.cep.replace(/\D/g, ''),
      addressNumber: input.titular.numero,
      addressComplement: input.titular.complemento || undefined,
      phone: input.titular.telefone?.replace(/\D/g, ''),
    },
  });
  return creditCardToken;
}
