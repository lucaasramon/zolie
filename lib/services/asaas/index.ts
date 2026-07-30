import { asaasClient } from './client';
import { userRepo } from '@/lib/repositories/user.repo';

interface ResolveCustomerInput {
  userId: string;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string | null;
  endereco: { cep: string; rua: string; numero: string; bairro: string };
}

export async function resolveCustomerId(input: ResolveCustomerInput): Promise<string> {
  const user = await userRepo.findById(input.userId);
  if (user?.asaasCustomerId) return user.asaasCustomerId;

  const telefone = input.telefone?.replace(/\D/g, '') || undefined;
  const customer = await asaasClient.createCustomer({
    name: input.nome,
    cpfCnpj: input.cpf.replace(/\D/g, ''),
    email: input.email,
    mobilePhone: telefone,
    postalCode: input.endereco.cep.replace(/\D/g, ''),
    address: input.endereco.rua,
    addressNumber: input.endereco.numero,
    province: input.endereco.bairro,
    externalReference: input.userId,
  });

  await userRepo.update(input.userId, { asaasCustomerId: customer.id });
  return customer.id;
}

export { asaasClient };
