import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '@/theme';

/** Navegação por abas entre as três telas principais. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        headerTitleStyle: { color: cores.texto },
        // Ajuste fino por plataforma: no Android a barra fica um pouco mais alta e com rótulos maiores.
        tabBarLabelStyle: Platform.select({ android: { fontSize: 12 }, default: { fontSize: 11 } }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Excedentes',
          tabBarIcon: ({ color, size }) => <Ionicons name="basket-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consulta"
        options={{
          title: 'Consultar alimento',
          tabBarLabel: 'Consultar',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico e impacto',
          tabBarLabel: 'Histórico',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color as string} size={size} />,
        }}
      />
    </Tabs>
  );
}
