import { Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isoParaDataLocal } from '@/utils/datas';
import type { ItemExcedente } from '@/types';

/**
 * Notificações locais de validade (versão nativa: Android e iOS).
 * Existe também `notificacoes.web.ts`: o Metro escolhe o arquivo pela extensão
 * de plataforma, então a web recebe uma implementação vazia sem `if` espalhados.
 */

const CANAL_ID = 'validade';
const HORA_AVISO = 9; // 09:00 da manhã

/** Define como a notificação aparece com o app aberto. Chamado uma vez no _layout. */
export function configurarNotificacoes(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Android 8+ exige um canal; no Android 13+ o pedido de permissão
  // só aparece depois que existe pelo menos um canal.
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CANAL_ID, {
      name: 'Avisos de validade',
      description: 'Lembra quando um excedente está perto de vencer',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#2E7D32',
    });
  }
}

/**
 * Pede permissão de forma compreensível:
 * 1) explica o motivo antes do diálogo do sistema;
 * 2) se o usuário negou de vez, oferece abrir as Configurações.
 */
export async function garantirPermissaoNotificacao(): Promise<boolean> {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;

  if (!atual.canAskAgain) {
    Alert.alert(
      'Notificações desativadas',
      'Para receber avisos de validade, ative as notificações do Desperdício Zero nas configurações do aparelho.',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  }

  const aceitouExplicacao = await new Promise<boolean>((resolve) =>
    Alert.alert(
      'Avisos de validade',
      'Vamos avisar um dia antes de cada item vencer, para que ele seja doado ou reaproveitado a tempo. Deseja permitir notificações?',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Permitir', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    ),
  );
  if (!aceitouExplicacao) return false;

  const resp = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return resp.granted;
}

/**
 * Calcula quando avisar: véspera da validade às 09:00.
 * Se a véspera já passou, avisa no próprio dia às 09:00; se isso também passou, não agenda.
 */
export function calcularDataAviso(validadeIso: string, agora: Date = new Date()): Date | null {
  const validade = isoParaDataLocal(validadeIso);
  const vespera = new Date(validade);
  vespera.setDate(vespera.getDate() - 1);
  vespera.setHours(HORA_AVISO, 0, 0, 0);
  if (vespera > agora) return vespera;
  const noDia = new Date(validade);
  noDia.setHours(HORA_AVISO, 0, 0, 0);
  return noDia > agora ? noDia : null;
}

/** Agenda o aviso de validade de um item. Retorna o id da notificação, ou undefined. */
export async function agendarAvisoValidade(
  item: Pick<ItemExcedente, 'id' | 'descricao' | 'validade' | 'quantidade' | 'unidade'>,
): Promise<string | undefined> {
  const quando = calcularDataAviso(item.validade);
  if (!quando) return undefined;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return undefined;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Excedente perto de vencer',
      body: `${item.descricao} (${item.quantidade} ${item.unidade}) — registre doação ou reaproveitamento.`,
      data: { itemId: item.id }, // usado para abrir a tela de detalhes ao tocar
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: quando,
      channelId: CANAL_ID,
    },
  });
}

export async function cancelarAviso(id?: string): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
}

/** Ouve toques na notificação e entrega o itemId para navegação. */
export function ouvirToqueNotificacao(aoTocar: (itemId: string) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const itemId = resp.notification.request.content.data?.itemId;
    if (typeof itemId === 'string') aoTocar(itemId);
  });
  return () => sub.remove();
}
