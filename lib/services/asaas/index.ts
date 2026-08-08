import { asaasClient } from './client';
import { userRepo } from '@/lib/repositories/user.repo';

interface ResolveCustomerInput {
  userId: string | null;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string | null;
  endereco: { cep: string; rua: string; numero: string; bairro: string };
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
    email: input.email,
    mobilePhone: telefone,
    postalCode: input.endereco.cep.replace(/\D/g, ''),
    address: input.endereco.rua,
    addressNumber: input.endereco.numero,
    province: input.endereco.bairro,
    externalReference: input.userId ?? undefined,
  });

  if (input.userId) await userRepo.update(input.userId, { asaasCustomerId: customer.id });
  return customer.id;
}

export { asaasClient };
