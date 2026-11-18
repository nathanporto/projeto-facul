import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, raio } from '@/theme';

interface Props {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
  icone?: string;
}

/** Chip selecionável — usado nos filtros, na escolha de categoria, unidade e tipo de destinação. */
export function Chip({ rotulo, selecionado, onPress, icone }: Props) {
  const cor = selecionado ? '#FFF' : cores.texto;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      style={[styles.chip, selecionado && styles.ativo]}
    >
      {icone && <Ionicons name={icone as keyof typeof Ionicons.glyphMap} size={14} color={cor} />}
      <Text style={[styles.texto, { color: cor }]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    borderRadius: raio.pill,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    marginRight: espaco.sm,
    marginBottom: espaco.sm,
  },
  ativo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { fontSize: 14, fontWeight: '500' },
});
