import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco } from '@/theme';
import { Botao } from './Botao';

/**
 * Componentes de estado reutilizáveis: carregamento, vazio e erro.
 * Todas as telas que dependem de dados (locais ou da API) usam os mesmos visuais.
 */

export function Carregando({ mensagem = 'Carregando...' }: { mensagem?: string }) {
  return (
    <View style={styles.centro} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={cores.primaria} />
      <Text style={styles.texto}>{mensagem}</Text>
    </View>
  );
}

interface VazioProps {
  titulo: string;
  mensagem?: string;
  icone?: keyof typeof Ionicons.glyphMap;
  acao?: { titulo: string; onPress: () => void };
}

export function EstadoVazio({ titulo, mensagem, icone = 'leaf-outline', acao }: VazioProps) {
  return (
    <View style={styles.centro}>
      <Ionicons name={icone} size={56} color={cores.primaria} />
      <Text style={styles.titulo}>{titulo}</Text>
      {mensagem && <Text style={styles.texto}>{mensagem}</Text>}
      {acao && <Botao titulo={acao.titulo} onPress={acao.onPress} estilo={styles.botao} />}
    </View>
  );
}

export function EstadoErro({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente?: () => void }) {
  return (
    <View style={styles.centro} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={56} color={cores.perigo} />
      <Text style={styles.titulo}>Algo deu errado</Text>
      <Text style={styles.texto}>{mensagem}</Text>
      {onTentarNovamente && (
        <Botao titulo="Tentar novamente" icone="refresh" variante="secundario" onPress={onTentarNovamente} estilo={styles.botao} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.xl, gap: espaco.sm },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto, textAlign: 'center' },
  texto: { fontSize: 14, color: cores.textoSuave, textAlign: 'center' },
  botao: { marginTop: espaco.md, alignSelf: 'stretch' },
});
