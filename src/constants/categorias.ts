import type { Categoria, FiltroValidade, TipoMovimentacao, Unidade } from '@/types';

/** Rótulos e ícones (Ionicons) de cada categoria — usados em chips, cards e formulário. */
export const CATEGORIAS: { valor: Categoria; rotulo: string; icone: string }[] = [
  { valor: 'hortifruti', rotulo: 'Hortifrúti', icone: 'leaf-outline' },
  { valor: 'padaria', rotulo: 'Padaria', icone: 'pizza-outline' },
  { valor: 'laticinios', rotulo: 'Laticínios', icone: 'water-outline' },
  { valor: 'carnes', rotulo: 'Carnes', icone: 'restaurant-outline' },
  { valor: 'graos', rotulo: 'Grãos', icone: 'nutrition-outline' },
  { valor: 'preparados', rotulo: 'Preparados', icone: 'fast-food-outline' },
  { valor: 'bebidas', rotulo: 'Bebidas', icone: 'beer-outline' },
  { valor: 'outros', rotulo: 'Outros', icone: 'cube-outline' },
];

export const UNIDADES: Unidade[] = ['un', 'kg', 'g', 'L'];

export const FILTROS_VALIDADE: { valor: FiltroValidade; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todas' },
  { valor: 'vencidos', rotulo: 'Vencidos' },
  { valor: 'hoje', rotulo: 'Vence hoje' },
  { valor: 'ate3', rotulo: 'Até 3 dias' },
  { valor: 'ate7', rotulo: 'Até 7 dias' },
];

export const TIPOS_MOVIMENTACAO: { valor: TipoMovimentacao; rotulo: string; icone: string }[] = [
  { valor: 'doacao', rotulo: 'Doação', icone: 'heart-outline' },
  { valor: 'retirada', rotulo: 'Retirada', icone: 'bag-handle-outline' },
  { valor: 'descarte', rotulo: 'Descarte', icone: 'trash-outline' },
];

export function rotuloCategoria(c: Categoria): string {
  return CATEGORIAS.find((x) => x.valor === c)?.rotulo ?? c;
}

export function rotuloMovimentacao(t: TipoMovimentacao): string {
  return TIPOS_MOVIMENTACAO.find((x) => x.valor === t)?.rotulo ?? t;
}
