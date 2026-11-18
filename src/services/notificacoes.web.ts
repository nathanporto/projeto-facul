import type { ItemExcedente } from '@/types';

/**
 * Implementação web (arquivo específico de plataforma).
 * Notificações locais agendadas não existem no navegador via expo-notifications,
 * então mantemos a MESMA assinatura da versão nativa com comportamento neutro.
 * As telas importam '@/services/notificacoes' sem saber qual arquivo foi usado.
 */
export function configurarNotificacoes(): void {}

export async function garantirPermissaoNotificacao(): Promise<boolean> {
  return false;
}

export function calcularDataAviso(_validadeIso: string, _agora?: Date): Date | null {
  return null;
}

export async function agendarAvisoValidade(
  _item: Pick<ItemExcedente, 'id' | 'descricao' | 'validade' | 'quantidade' | 'unidade'>,
): Promise<string | undefined> {
  return undefined;
}

export async function cancelarAviso(_id?: string): Promise<void> {}

export function ouvirToqueNotificacao(_aoTocar: (itemId: string) => void): () => void {
  return () => {};
}
