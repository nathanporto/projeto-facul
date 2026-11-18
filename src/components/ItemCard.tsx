import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ItemExcedente } from '@/types';
import { CATEGORIAS, rotuloCategoria } from '@/constants/categorias';
import { cores, espaco, raio, sombra } from '@/theme';
import { isoParaBr } from '@/utils/datas';
import { SeloValidade } from './SeloValidade';

interface Props {
  item: ItemExcedente;
  onPress: (id: string) => void;
}

/**
 * Card de um item na FlatList.
 * memo evita re-renderizar cards cujo item não mudou quando a lista é filtrada.
 */
function ItemCardBase({ item, onPress }: Props) {
  const icone = CATEGORIAS.find((c) => c.valor === item.categoria)?.icone ?? 'cube-outline';
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`${item.descricao}, ${item.quantidade} ${item.unidade}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      {item.fotoUri ? (
        <Image source={{ uri: item.fotoUri }} style={styles.foto} />
      ) : (
        <View style={[styles.foto, styles.semFoto]}>
          <Ionicons name={icone as keyof typeof Ionicons.glyphMap} size={28} color={cores.primaria} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={1}>
          {item.descricao}
        </Text>
        <Text style={styles.sub}>
          {rotuloCategoria(item.categoria)} · {item.quantidade} {item.unidade} · val. {isoParaBr(item.validade)}
        </Text>
        <SeloValidade validade={item.validade} />
      </View>
      <Ionicons name="chevron-forward" size={20} color={cores.textoSuave} />
    </Pressable>
  );
}

export const ItemCard = memo(ItemCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', // Flexbox: foto | informações | seta
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    padding: espaco.md,
    marginBottom: espaco.md,
    gap: espaco.md,
    ...sombra,
  },
  foto: { width: 64, height: 64, borderRadius: raio.sm },
  semFoto: { backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: espaco.xs }, // flex: 1 ocupa o espaço restante e permite truncar o texto
  titulo: { fontSize: 16, fontWeight: '700', color: cores.texto },
  sub: { fontSize: 13, color: cores.textoSuave },
});
