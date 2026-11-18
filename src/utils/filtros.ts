import type { Categoria, FiltroValidade, ItemExcedente } from '@/types';
import { diasParaVencer, passaFiltroValidade } from './datas';

export interface CriteriosFiltro {
  categoria: Categoria | 'todas';
  validade: FiltroValidade;
  busca: string;
}

/** Remove acentos para que "laticinio" encontre "Laticínio". */
function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Filtra os itens disponíveis pelos critérios da tela de lista e
 * ordena do que vence primeiro para o que vence por último (prioriza o reaproveitamento).
 */
export function filtrarItens(
  itens: ItemExcedente[],
  c: CriteriosFiltro,
  agora: Date = new Date(),
): ItemExcedente[] {
  const termo = normalizar(c.busca.trim());
  return itens
    .filter((i) => i.status === 'disponivel')
    .filter((i) => c.categoria === 'todas' || i.categoria === c.categoria)
    .filter((i) => passaFiltroValidade(i.validade, c.validade, agora))
    .filter((i) => !termo || normalizar(i.descricao).includes(termo))
    .sort((a, b) => diasParaVencer(a.validade, agora) - diasParaVencer(b.validade, agora));
}
