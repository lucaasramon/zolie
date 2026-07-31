import { withAuth } from '@/lib/http/withAuth';
import { ok } from '@/lib/http/envelope';
import { resolveCustomerId } from '@/lib/services/asaas';
import { userRepo } from '@/lib/repositories/user.repo';
import { addressRepo } from '@/lib/repositories/address.repo';
import { AppError, notFound, forbidden } from '@/lib/utils/errors';
import { z } from 'zod';

const bodySchema = z.object({ enderecoId: z.string().min(1) });

// Resolve (ou cria) o Asaas Customer do usuário ANTES da tokenização de cartão no
// client: o Asaas.js precisa do customer id para gerar o creditCardToken no navegador.
export const POST = withAuth(async (req, _ctx, authUser) => {
  const { enderecoId } = bodySchema.parse(await req.json());

  const user = await userRepo.findById(authUser.sub);
  if (!user) throw notFound('Usuário');
  if (!user.cpf) throw new AppError('Cadastre seu CPF antes de continuar', 422, 'CPF_REQUIRED');

  const endereco = await addressRepo.findById(enderecoId);
  if (!endereco) throw notFound('Endereço');
  if (endereco.userId !== user.id) throw forbidden();

  const customerId = await resolveCustomerId({
    userId: user.id,
    nome: user.nome,
    email: user.email,
    cpf: user.cpf,
    telefone: user.telefone,
    endereco: { cep: endereco.cep, rua: endereco.rua, numero: endereco.numero, bairro: endereco.bairro },
  });

  return ok({ asaasCustomerId: customerId });
});
