import type { Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { cores, espaco, raio } from '@/theme';

interface Props extends TextInputProps {
  rotulo: string;
  erro?: string;
  dica?: string;
  ref?: Ref<TextInputInstance>;
}

/**
 * TextInput com rótulo, dica e mensagem de erro de validação.
 * Repassa todas as props nativas (...rest), então serve para texto, número ou data.
 * No React 19, `ref` é uma prop comum (sem forwardRef): o formulário a usa
 * para mover o foco para o próximo campo.
 */
export function CampoTexto({ rotulo, erro, dica, style, ref, ...rest }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={cores.textoSuave}
        accessibilityLabel={rotulo}
        accessibilityHint={erro}
        style={[styles.input, erro ? styles.inputErro : null, rest.multiline && styles.multilinha, style]}
        {...rest}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : dica ? <Text style={styles.dica}>{dica}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: espaco.md },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto, marginBottom: espaco.xs },
  input: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm + 2,
    fontSize: 16,
    color: cores.texto,
  },
  multilinha: { minHeight: 80, textAlignVertical: 'top' },
  inputErro: { borderColor: cores.perigo, backgroundColor: cores.perigoClaro },
  erro: { color: cores.perigo, fontSize: 13, marginTop: espaco.xs },
  dica: { color: cores.textoSuave, fontSize: 12, marginTop: espaco.xs },
});
