import { describe, expect, it } from 'vitest';
import { comCorrecoes, ContextoSimulacao, CORES_PINGENTE, descreverModelo, promptFrente, promptVerificacao, promptVerso } from './prompt';

const ctx: ContextoSimulacao = {
  nomeProduto: 'Colar Personalizado Prata 925',
  material: 'PRATA_925',
  modelo: descreverModelo('Medalha Coração 12mm'),
  corrente: 'Corrente 45 cm',
  fotosProduto: 2,
  fotosCliente: 1,
  textoVerso: 'Helena ♥ 12/03/2024',
  fonte: '06 savoyeLetPlain',
  pingente: true,
  corPingente: CORES_PINGENTE[0],
  analise: null,
};

describe('descreverModelo', () => {
  it('traduz o formato e o tamanho do modelo', () => {
    expect(descreverModelo('Medalha Coração 12mm')).toBe('"Medalha Coração 12mm" (Portuguese name; meaning: HEART-shaped MEDAL pendant, 12 mm in size)');
    expect(descreverModelo('Medalha Redonda')).toContain('ROUND');
    expect(descreverModelo('Placa retangular')).toContain('RECTANGULAR flat PLATE/TAG');
    expect(descreverModelo('Modelo X')).toBe('"Modelo X"');
  });
});

describe('promptFrente', () => {
  const p = promptFrente(ctx);

  it('trata a foto do anúncio como a imagem editada e exige o mesmo modelo', () => {
    expect(p).toContain('Image 1: THE OFFICIAL PRODUCT PHOTO');
    expect(p).toContain('THE PIECE MUST BE THE SAME MODEL');
    expect(p).toContain('"Medalha Coração 12mm"');
  });

  it('referencia a foto da cliente pelo índice certo', () => {
    expect(p).toContain('Image 3: a photo uploaded by the customer');
    expect(p).toContain('Image 3) onto the front face');
  });

  it('não leva o texto do verso para a frente', () => {
    expect(p).not.toContain('Helena');
  });

  it('pede exatamente um pingente da cor sorteada', () => {
    expect(p).toContain(`${CORES_PINGENTE[0].en} color`);
    expect(p).toContain('Exactly one charm');
  });

  it('sem foto da cliente, a frente fica sem gravação', () => {
    expect(promptFrente({ ...ctx, fotosCliente: 0 })).toContain('WHAT TO ENGRAVE ON THE FRONT: NOTHING');
  });
});

describe('promptVerso', () => {
  const p = promptVerso({ ...ctx, fotosCliente: 0 });

  it('leva o texto literal entre marcadores e a descrição da fonte', () => {
    expect(p).toContain('<<<Helena ♥ 12/03/2024>>>');
    expect(p).toContain('Savoye LET');
    expect(p).toContain('NOT mirrored');
  });

  it('não cita fotos da cliente no verso', () => {
    expect(p).not.toContain('uploaded by the customer');
  });

  it('sem texto, o verso fica liso', () => {
    expect(promptVerso({ ...ctx, textoVerso: null, fotosCliente: 0 })).toContain('WHAT TO ENGRAVE ON THE BACK: NOTHING');
  });

  it('sem pingente, proíbe adicionar coração', () => {
    expect(promptVerso({ ...ctx, pingente: false, fotosCliente: 0 })).toContain('Do not add any heart');
  });
});

describe('verificação e correções', () => {
  it('a imagem inspecionada é a última e o texto é conferido literalmente', () => {
    const v = promptVerificacao(
      { lado: 'verso', modelo: ctx.modelo, textoVerso: ctx.textoVerso, fonte: ctx.fonte, fotosCliente: 1, pingente: true, corPingente: ctx.corPingente },
      2,
    );
    expect(v).toContain('image 3) is the GENERATED BACK');
    expect(v).toContain('<<<Helena ♥ 12/03/2024>>>');
  });

  it('anexa as correções ao prompt original', () => {
    expect(comCorrecoes('BASE', ['Fix X'])).toContain('BASE');
    expect(comCorrecoes('BASE', ['Fix X'])).toContain('- Fix X');
    expect(comCorrecoes('BASE', [])).toBe('BASE');
  });
});
