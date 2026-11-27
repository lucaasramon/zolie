import { withOptionalAuth } from '@/lib/http/withAuth';
import { ok } from '@/lib/http/envelope';
import { resolveCustomerId } from '@/lib/services/asaas';
import { userRepo } from '@/lib/repositories/user.repo';
import { addressRepo } from '@/lib/repositories/address.repo';
import { AppError, notFound, forbidden } from '@/lib/utils/errors';
import { asaasCustomerSchema } from '@/lib/validation/schemas';

// Resolve (ou cria) o Asaas Customer ANTES da tokenização de cartão no client:
// o Asaas.js precisa do customer id para gerar o creditCardToken no navegador.
// Funciona tanto para usuário autenticado (enderecoId de uma conta) quanto para
// convidado (dados informados inline no checkout).
export const POST = withOptionalAuth(async (req, _ctx, authUser) => {
  const { enderecoId, guest, retirada, guestRetirada, titular } = asaasCustomerSchema.parse(await req.json());

  // Retirada: sem endereço de entrega — o customer leva só o CEP/número do titular.
  if (retirada) {
    const contato = authUser ? await userRepo.findById(authUser.sub) : guestRetirada;
    if (!contato) throw new AppError('Informe seus dados para continuar', 422, 'GUEST_DATA_REQUIRED');
    if (!contato.cpf) throw new AppError('Cadastre seu CPF antes de continuar', 422, 'CPF_REQUIRED');
    const customerId = await resolveCustomerId({
      userId: authUser?.sub ?? null,
      nome: contato.nome,
      email: contato.email,
      cpf: contato.cpf,
      telefone: contato.telefone,
      endereco: titular ? { cep: titular.cep, numero: titular.numero } : null,
    });
    return ok({ asaasCustomerId: customerId });
  }

  if (authUser) {
    const user = await userRepo.findById(authUser.sub);
    if (!user) throw notFound('Usuário');
    if (!user.cpf) throw new AppError('Cadastre seu CPF antes de continuar', 422, 'CPF_REQUIRED');
    if (!enderecoId) throw new AppError('Selecione um endereço de entrega', 422, 'ENDERECO_REQUIRED');

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
  }

  if (!guest) throw new AppError('Informe seus dados para continuar', 422, 'GUEST_DATA_REQUIRED');

  const customerId = await resolveCustomerId({
    userId: null,
    nome: guest.nome,
    email: guest.email,
    cpf: guest.cpf,
    telefone: guest.telefone,
    endereco: { cep: guest.cep, rua: guest.rua, numero: guest.numero, bairro: guest.bairro },
  });

  return ok({ asaasCustomerId: customerId });
});
