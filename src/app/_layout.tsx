import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ItensProvider } from '@/context/ItensContext';
import { configurarNotificacoes, ouvirToqueNotificacao } from '@/services/notificacoes';
import { cores } from '@/theme';

// Configura o handler de notificações uma única vez, fora do ciclo de renderização.
configurarNotificacoes();

/**
 * Layout raiz (Expo Router): Provider global + navegação em pilha (Stack).
 * As abas ficam no grupo "(tabs)"; cadastro e detalhes são empilhados por cima.
 */
export default function RootLayout() {
  // Ao tocar no aviso de validade, abre direto a tela de detalhes do item.
  useEffect(
    () => ouvirToqueNotificacao((itemId) => router.push({ pathname: '/item/[id]', params: { id: itemId } })),
    [],
  );

  return (
    <ItensProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.superficie },
          headerTintColor: cores.primaria,
          headerTitleStyle: { color: cores.texto },
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/novo" options={{ title: 'Novo excedente', presentation: 'modal' }} />
        <Stack.Screen name="item/[id]" options={{ title: 'Detalhes do item' }} />
      </Stack>
    </ItensProvider>
  );
}
