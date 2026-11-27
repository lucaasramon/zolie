import { asaasClient } from './client';
import { userRepo } from '@/lib/repositories/user.repo';

interface ResolveCustomerInput {
  userId: string | null;
  nome: string;
  /** Vazio na retirada sem e-mail: o Asaas aceita customer só com nome e CPF. */
  email?: string | null;
  cpf: string;
  telefone?: string | null;
  /** Na retirada não há endereço de entrega: no máximo o CEP/número do titular do cartão. */
  endereco?: { cep: string; rua?: string; numero: string; bairro?: string } | null;
}

export async function resolveCustomerId(input: ResolveCustomerInput): Promise<string> {
  const cpfLimpo = input.cpf.replace(/\D/g, '');

  if (input.userId) {
    const user = await userRepo.findById(input.userId);
    if (user?.asaasCustomerId) return user.asaasCustomerId;
  } else {
    // Convidado: sem User para cachear o id, reaproveita um customer existente
    // pelo CPF antes de criar um novo — evita duplicar customers na Asaas a
    // cada recompra do mesmo CPF.
    const existente = await asaasClient.findCustomerByCpf(cpfLimpo);
    if (existente) return existente.id;
  }

  const telefone = input.telefone?.replace(/\D/g, '') || undefined;
  const customer = await asaasClient.createCustomer({
    name: input.nome,
    cpfCnpj: cpfLimpo,
    email: input.email || undefined,
    mobilePhone: telefone,
    postalCode: input.endereco?.cep.replace(/\D/g, '') || undefined,
    address: input.endereco?.rua || undefined,
    addressNumber: input.endereco?.numero || undefined,
    province: input.endereco?.bairro || undefined,
    externalReference: input.userId ?? undefined,
  });

  if (input.userId) await userRepo.update(input.userId, { asaasCustomerId: customer.id });
  return customer.id;
}

export { asaasClient };
