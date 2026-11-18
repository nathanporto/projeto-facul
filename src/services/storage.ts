import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemExcedente, Movimentacao } from '@/types';

/**
 * Persistência local com AsyncStorage (chave/valor, assíncrono, só strings).
 * Por isso serializamos os arrays em JSON. O prefixo "@dz/" evita colisão de chaves
 * e o sufixo de versão permite migrar o formato no futuro.
 */
const CHAVES = {
  itens: '@dz/itens:v1',
  movimentacoes: '@dz/movimentacoes:v1',
} as const;

async function lerLista<T>(chave: string): Promise<T[]> {
  const bruto = await AsyncStorage.getItem(chave);
  if (!bruto) return [];
  try {
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as T[]) : [];
  } catch {
    // Dado corrompido: melhor começar vazio do que travar o app.
    return [];
  }
}

export const storage = {
  carregarItens: () => lerLista<ItemExcedente>(CHAVES.itens),
  salvarItens: (itens: ItemExcedente[]) => AsyncStorage.setItem(CHAVES.itens, JSON.stringify(itens)),
  carregarMovimentacoes: () => lerLista<Movimentacao>(CHAVES.movimentacoes),
  salvarMovimentacoes: (movs: Movimentacao[]) =>
    AsyncStorage.setItem(CHAVES.movimentacoes, JSON.stringify(movs)),
  limparTudo: () => AsyncStorage.multiRemove(Object.values(CHAVES)),
};
