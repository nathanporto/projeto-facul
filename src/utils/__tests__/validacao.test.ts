import { parseNumero, temErros, validarItem, validarMovimentacao } from '../validacao';

const AGORA = new Date(2026, 10, 17);
const valido = { descricao: 'Pães franceses', quantidade: '2,5', validade: '20/11/2026', observacoes: '' };

describe('validarItem', () => {
  it('aceita um formulário válido', () => {
    expect(temErros(validarItem(valido, AGORA))).toBe(false);
  });

  it('exige descrição com tamanho mínimo', () => {
    expect(validarItem({ ...valido, descricao: '' }, AGORA).descricao).toBeDefined();
    expect(validarItem({ ...valido, descricao: 'ab' }, AGORA).descricao).toMatch(/3 caracteres/);
  });

  it('valida quantidade numérica e positiva (aceita vírgula)', () => {
    expect(parseNumero('2,5')).toBe(2.5);
    expect(validarItem({ ...valido, quantidade: '0' }, AGORA).quantidade).toBeDefined();
    expect(validarItem({ ...valido, quantidade: 'abc' }, AGORA).quantidade).toBeDefined();
  });

  it('valida a data de validade', () => {
    expect(validarItem({ ...valido, validade: '31/02/2026' }, AGORA).validade).toMatch(/inválida/);
    expect(validarItem({ ...valido, validade: '01/01/2026' }, AGORA).validade).toMatch(/descarte/);
  });
});

describe('validarMovimentacao', () => {
  const item = { quantidade: 5 };

  it('não permite retirar mais do que o disponível', () => {
    const e = validarMovimentacao({ quantidade: '6', responsavel: 'Ana', tipo: 'retirada', destino: '' }, item);
    expect(e.quantidade).toMatch(/Máximo/);
  });

  it('exige destino quando é doação', () => {
    const e = validarMovimentacao({ quantidade: '2', responsavel: 'Ana', tipo: 'doacao', destino: '' }, item);
    expect(e.destino).toBeDefined();
  });

  it('aceita descarte sem destino', () => {
    const e = validarMovimentacao({ quantidade: '5', responsavel: 'Ana', tipo: 'descarte', destino: '' }, item);
    expect(temErros(e)).toBe(false);
  });
});
