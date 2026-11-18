import { useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { escolherFoto, type OrigemFoto } from '@/services/fotos';
import { cores, espaco, raio } from '@/theme';

interface Props {
  uri?: string;
  onChange: (uri?: string) => void;
}

/**
 * Área de foto do item: toca para escolher entre câmera e galeria.
 * Diferença de plataforma: no iOS usamos o ActionSheet nativo;
 * no Android (e web) um Alert com botões, que é o padrão de cada sistema.
 */
export function SeletorFoto({ uri, onChange }: Props) {
  const [ocupado, setOcupado] = useState(false);

  async function usar(origem: OrigemFoto) {
    setOcupado(true);
    try {
      const nova = await escolherFoto(origem);
      if (nova) onChange(nova);
    } finally {
      setOcupado(false);
    }
  }

  function abrirOpcoes() {
    const opcoes = ['Tirar foto', 'Escolher da galeria', ...(uri ? ['Remover foto'] : []), 'Cancelar'];
    const tratar = (indice: number) => {
      if (indice === 0) void usar('camera');
      else if (indice === 1) void usar('galeria');
      else if (uri && indice === 2) onChange(undefined);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: opcoes,
          cancelButtonIndex: opcoes.length - 1,
          destructiveButtonIndex: uri ? 2 : undefined,
        },
        tratar,
      );
    } else {
      Alert.alert('Foto do item', 'Escolha a origem da imagem', [
        { text: 'Câmera', onPress: () => tratar(0) },
        { text: 'Galeria', onPress: () => tratar(1) },
        ...(uri ? [{ text: 'Remover', style: 'destructive' as const, onPress: () => tratar(2) }] : []),
        { text: 'Cancelar', style: 'cancel' as const },
      ]);
    }
  }

  return (
    <Pressable onPress={abrirOpcoes} disabled={ocupado} accessibilityRole="button" accessibilityLabel="Adicionar foto do item">
      {uri ? (
        <Image source={{ uri }} style={styles.area} />
      ) : (
        <View style={[styles.area, styles.vazia]}>
          <Ionicons name="camera-outline" size={36} color={cores.primaria} />
          <Text style={styles.texto}>{ocupado ? 'Abrindo...' : 'Adicionar foto (opcional)'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { width: '100%', aspectRatio: 4 / 3, borderRadius: raio.md, marginBottom: espaco.md },
  vazia: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.primaria,
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
  },
  texto: { color: cores.primaria, fontWeight: '600' },
});
