import { filtrarItens } from '../filtros';
import type { ItemExcedente } from '@/types';

const AGORA = new Date(2026, 10, 17);

function item(parcial: Partial<ItemExcedente>): ItemExcedente {
  return {
    id: Math.random().toString(),
    descricao: 'Item',
    categoria: 'outros',
    quantidade: 1,
    quantidadeInicial: 1,
    unidade: 'un',
    validade: '2026-11-30',
    status: 'disponivel',
    criadoEm: AGORA.toISOString(),
    ...parcial,
  };
}

const itens = [
  item({ descricao: 'Leite integral', categoria: 'laticinios', validade: '2026-11-19' }),
  item({ descricao: 'Pão de forma', categoria: 'padaria', validade: '2026-11-17' }),
  item({ descricao: 'Banana', categoria: 'hortifruti', validade: '2026-11-25' }),
  item({ descricao: 'Iogurte', categoria: 'laticinios', validade: '2026-11-18', status: 'doado' }),
];

describe('filtrarItens', () => {
  it('mostra só disponíveis, ordenados pela validade mais próxima', () => {
    const r = filtrarItens(itens, { categoria: 'todas', validade: 'todos', busca: '' }, AGORA);
    expect(r.map((i) => i.descricao)).toEqual(['Pão de forma', 'Leite integral', 'Banana']);
  });

  it('filtra por categoria', () => {
    const r = filtrarItens(itens, { categoria: 'laticinios', validade: 'todos', busca: '' }, AGORA);
    expect(r).toHaveLength(1);
    expect(r[0].descricao).toBe('Leite integral');
  });

  it('combina filtro de validade e busca sem acento', () => {
    expect(filtrarItens(itens, { categoria: 'todas', validade: 'ate3', busca: '' }, AGORA)).toHaveLength(2);
    expect(filtrarItens(itens, { categoria: 'todas', validade: 'todos', busca: 'pao' }, AGORA)).toHaveLength(1);
  });
});
