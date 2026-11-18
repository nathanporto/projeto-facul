import type { FiltroValidade } from '@/types';

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Converte "DD/MM/AAAA" (formato digitado pelo usuário) em "AAAA-MM-DD".
 * Retorna null se a data não existir (ex.: 31/02/2025).
 */
export function brParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const d = Number(dd);
  const mes = Number(mm);
  const ano = Number(aaaa);
  const data = new Date(ano, mes - 1, d);
  // Se o Date "rolou" para outro mês, a data digitada não existe.
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== d) {
    return null;
  }
  return `${aaaa}-${mm}-${dd}`;
}

/** "AAAA-MM-DD" -> "DD/MM/AAAA" para exibição. */
export function isoParaBr(iso: string): string {
  const [aaaa, mm, dd] = iso.slice(0, 10).split('-');
  return `${dd}/${mm}/${aaaa}`;
}

/** Cria um Date local à meia-noite a partir de "AAAA-MM-DD" (evita bug de fuso UTC). */
export function isoParaDataLocal(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function hojeIso(agora: Date = new Date()): string {
  const a = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Dias restantes até a validade (negativo = vencido, 0 = vence hoje). */
export function diasParaVencer(validadeIso: string, agora: Date = new Date()): number {
  const hoje = isoParaDataLocal(hojeIso(agora));
  const validade = isoParaDataLocal(validadeIso);
  return Math.round((validade.getTime() - hoje.getTime()) / MS_DIA);
}

/** Aplica o máscara DD/MM/AAAA enquanto o usuário digita. */
export function mascaraData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** Texto amigável sobre a validade, usado no card e nos detalhes. */
export function descreverValidade(validadeIso: string, agora: Date = new Date()): string {
  const dias = diasParaVencer(validadeIso, agora);
  if (dias < 0) return `Vencido há ${-dias} dia${dias === -1 ? '' : 's'}`;
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Vence amanhã';
  return `Vence em ${dias} dias`;
}

/** Verifica se uma validade passa no filtro selecionado na lista. */
export function passaFiltroValidade(
  validadeIso: string,
  filtro: FiltroValidade,
  agora: Date = new Date(),
): boolean {
  const dias = diasParaVencer(validadeIso, agora);
  switch (filtro) {
    case 'todos':
      return true;
    case 'vencidos':
      return dias < 0;
    case 'hoje':
      return dias === 0;
    case 'ate3':
      return dias >= 0 && dias <= 3;
    case 'ate7':
      return dias >= 0 && dias <= 7;
  }
}

/** Data e hora curtas para o histórico. */
export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}
