import type { ItemExcedente, NovaMovimentacaoInput } from '@/types';
import { brParaIso, diasParaVencer } from './datas';

/** Valores crus do formulário de cadastro (tudo string, como vem do TextInput). */
export interface FormItemValores {
  descricao: string;
  quantidade: string;
  validade: string; // DD/MM/AAAA
  observacoes: string;
}

export type ErrosForm<T> = Partial<Record<keyof T, string>>;

/** Aceita "1,5" ou "1.5" — o teclado numérico brasileiro usa vírgula. */
export function parseNumero(texto: string): number {
  return Number(texto.trim().replace(',', '.'));
}

/**
 * Valida o formulário de cadastro de excedente.
 * Funções puras (sem React) facilitam os testes unitários com Jest.
 */
export function validarItem(v: FormItemValores, agora: Date = new Date()): ErrosForm<FormItemValores> {
  const erros: ErrosForm<FormItemValores> = {};

  const descricao = v.descricao.trim();
  if (!descricao) erros.descricao = 'Informe a descrição do item.';
  else if (descricao.length < 3) erros.descricao = 'A descrição deve ter pelo menos 3 caracteres.';
  else if (descricao.length > 80) erros.descricao = 'Use no máximo 80 caracteres.';

  if (!v.quantidade.trim()) erros.quantidade = 'Informe a quantidade.';
  else {
    const q = parseNumero(v.quantidade);
    if (Number.isNaN(q)) erros.quantidade = 'Quantidade deve ser um número.';
    else if (q <= 0) erros.quantidade = 'Quantidade deve ser maior que zero.';
    else if (q > 100000) erros.quantidade = 'Quantidade muito alta.';
  }

  if (!v.validade.trim()) erros.validade = 'Informe a data de validade.';
  else {
    const iso = brParaIso(v.validade);
    if (!iso) erros.validade = 'Data inválida. Use o formato DD/MM/AAAA.';
    else if (diasParaVencer(iso, agora) < -30)
      erros.validade = 'Validade vencida há mais de 30 dias — registre como descarte.';
  }

  if (v.observacoes.length > 300) erros.observacoes = 'Use no máximo 300 caracteres.';

  return erros;
}

/** Valida o registro de retirada/doação/descarte contra a quantidade disponível. */
export function validarMovimentacao(
  m: { quantidade: string; responsavel: string; tipo: NovaMovimentacaoInput['tipo']; destino: string },
  item: Pick<ItemExcedente, 'quantidade'>,
): ErrosForm<typeof m> {
  const erros: ErrosForm<typeof m> = {};
  const q = parseNumero(m.quantidade);
  if (!m.quantidade.trim() || Number.isNaN(q)) erros.quantidade = 'Informe uma quantidade válida.';
  else if (q <= 0) erros.quantidade = 'Quantidade deve ser maior que zero.';
  else if (q > item.quantidade) erros.quantidade = `Máximo disponível: ${item.quantidade}.`;

  if (m.responsavel.trim().length < 2) erros.responsavel = 'Informe quem é o responsável.';
  if (m.tipo === 'doacao' && m.destino.trim().length < 2)
    erros.destino = 'Informe a instituição ou pessoa que recebeu a doação.';
  return erros;
}

export function temErros(erros: object): boolean {
  return Object.keys(erros).length > 0;
}
