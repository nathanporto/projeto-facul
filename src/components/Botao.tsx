import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, raio } from '@/theme';

type Variante = 'primario' | 'secundario' | 'perigo';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icone?: keyof typeof Ionicons.glyphMap;
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: ViewStyle;
}

/** Botão reutilizável com variantes visuais, ícone opcional e estado de carregamento. */
export function Botao({ titulo, onPress, variante = 'primario', icone, carregando, desabilitado, estilo }: Props) {
  const inativo = desabilitado || carregando;
  const corTexto = variante === 'secundario' ? cores.primaria : '#FFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      onPress={onPress}
      disabled={inativo}
      // android_ripple só existe no Android; no iOS o feedback vem do "pressed" abaixo.
      android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
      style={({ pressed }) => [
        styles.base,
        styles[variante],
        pressed && styles.pressionado,
        inativo && styles.inativo,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View style={styles.conteudo}>
          {icone && <Ionicons name={icone} size={18} color={corTexto} />}
          <Text style={[styles.texto, { color: corTexto }]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // área de toque mínima recomendada
    borderRadius: raio.md,
    paddingHorizontal: espaco.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  primario: { backgroundColor: cores.primaria },
  secundario: { backgroundColor: cores.primariaClara, borderWidth: 1, borderColor: cores.primaria },
  perigo: { backgroundColor: cores.perigo },
  pressionado: { opacity: 0.85 },
  inativo: { opacity: 0.5 },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  texto: { fontSize: 16, fontWeight: '600' },
});
