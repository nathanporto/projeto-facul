import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '@/theme';
import { descreverValidade, diasParaVencer } from '@/utils/datas';

/** Selo colorido de urgência: vermelho (vencido/hoje), laranja (≤3 dias), verde (ok). */
export function SeloValidade({ validade }: { validade: string }) {
  const dias = diasParaVencer(validade);
  const [fundo, texto] =
    dias <= 0 ? [cores.perigoClaro, cores.perigo] : dias <= 3 ? [cores.alertaClaro, cores.alerta] : [cores.primariaClara, cores.primaria];
  return (
    <View style={[styles.selo, { backgroundColor: fundo }]}>
      <Text style={[styles.texto, { color: texto }]}>{descreverValidade(validade)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: { alignSelf: 'flex-start', paddingHorizontal: espaco.sm, paddingVertical: 2, borderRadius: raio.pill },
  texto: { fontSize: 12, fontWeight: '700' },
});
