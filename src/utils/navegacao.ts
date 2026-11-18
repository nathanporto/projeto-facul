import { router } from 'expo-router';

/**
 * Volta para a tela anterior; se a tela foi aberta direto (deep link ou toque
 * na notificação com o app fechado), não há histórico — então vai para a lista.
 */
export function voltarOuIrParaLista(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
