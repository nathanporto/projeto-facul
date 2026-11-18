import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useItens } from '@/context/ItensContext';
import { Botao } from '@/components/Botao';
import { Carregando, EstadoVazio } from '@/components/EstadoTela';
import { rotuloMovimentacao } from '@/constants/categorias';
import { ErroApi, sincronizar } from '@/services/api';
import { formatarDataHora } from '@/utils/datas';
import type { Movimentacao, TipoMovimentacao } from '@/types';
import { cores, espaco, raio, sombra } from '@/theme';

const ICONE_TIPO: Record<TipoMovimentacao, keyof typeof Ionicons.glyphMap> = {
  doacao: 'heart',
  retirada: 'bag-handle',
  descarte: 'trash',
};
const COR_TIPO: Record<TipoMovimentacao, string> = {
  doacao: cores.primaria,
  retirada: cores.info,
  descarte: cores.perigo,
};

/** Tela 5 — Histórico de retiradas/doações/descartes, indicadores e sincronização com a API. */
export default function HistoricoScreen() {
  const { itens, movimentacoes, carregando, marcarSincronizado } = useItens();
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState<string>();

  // Indicadores de impacto: quantos registros de cada tipo e % reaproveitado.
  const resumo = useMemo(() => {
    const cont = { doacao: 0, retirada: 0, descarte: 0 };
    movimentacoes.forEach((m) => (cont[m.tipo] += 1));
    const total = movimentacoes.length;
    const reaproveitado = total ? Math.round(((cont.doacao + cont.retirada) / total) * 100) : 0;
    return { ...cont, total, reaproveitado };
  }, [movimentacoes]);

  async function sincronizarAgora() {
    setSincronizando(true);
    try {
      const r = await sincronizar(itens, movimentacoes);
      marcarSincronizado(r.enviadoEm);
      setUltimaSync(r.enviadoEm);
      Alert.alert('Sincronização concluída', `${itens.length} item(ns) e ${movimentacoes.length} registro(s) enviados. Protocolo #${r.protocolo}.`);
    } catch (e) {
      Alert.alert('Falha na sincronização', e instanceof ErroApi ? e.message : 'Erro inesperado.');
    } finally {
      setSincronizando(false);
    }
  }

  if (carregando) return <Carregando />;

  const renderMov = ({ item: m }: { item: Movimentacao }) => (
    <View style={styles.mov}>
      <View style={[styles.iconeMov, { backgroundColor: COR_TIPO[m.tipo] }]}>
        <Ionicons name={ICONE_TIPO[m.tipo]} size={16} color="#FFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.movTitulo}>
          {rotuloMovimentacao(m.tipo)} · {m.quantidade} {m.unidade} de {m.itemDescricao}
        </Text>
        <Text style={styles.movSub}>
          {formatarDataHora(m.data)} · {m.responsavel}
          {m.destino ? ` → ${m.destino}` : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={movimentacoes}
      keyExtractor={(m) => m.id}
      renderItem={renderMov}
      contentContainerStyle={styles.conteudo}
      ListHeaderComponent={
        <View style={{ gap: espaco.md, marginBottom: espaco.md }}>
          {/* Grade de indicadores com Flexbox (flexWrap + flexBasis) — se adapta à largura da tela */}
          <View style={styles.grade}>
            <Indicador titulo="Doações" valor={resumo.doacao} cor={cores.primaria} />
            <Indicador titulo="Retiradas" valor={resumo.retirada} cor={cores.info} />
            <Indicador titulo="Descartes" valor={resumo.descarte} cor={cores.perigo} />
            <Indicador titulo="Reaproveitado" valor={`${resumo.reaproveitado}%`} cor={cores.alerta} />
          </View>

          <View style={styles.syncCard}>
            <Text style={styles.syncTitulo}>Sincronização com o servidor</Text>
            <Text style={styles.movSub}>
              Envia os itens e registros locais para a API REST ({String(Constants.expoConfig?.extra?.apiSyncUrl ?? 'padrão')}).
            </Text>
            {ultimaSync && <Text style={styles.movSub}>Última sincronização: {formatarDataHora(ultimaSync)}</Text>}
            <Botao titulo="Sincronizar agora" icone="cloud-upload-outline" onPress={sincronizarAgora} carregando={sincronizando} />
          </View>

          <Text style={styles.secao}>Registros ({resumo.total})</Text>
        </View>
      }
      ListEmptyComponent={
        <EstadoVazio
          icone="document-text-outline"
          titulo="Nenhum registro ainda"
          mensagem="Abra um item e registre uma doação, retirada ou descarte."
        />
      }
    />
  );
}

function Indicador({ titulo, valor, cor }: { titulo: string; valor: number | string; cor: string }) {
  return (
    <View style={styles.indicador}>
      <Text style={[styles.indValor, { color: cor }]}>{valor}</Text>
      <Text style={styles.indTitulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: espaco.lg, flexGrow: 1, backgroundColor: cores.fundo },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.md },
  indicador: {
    flexGrow: 1,
    flexBasis: '40%', // 2 colunas no celular; mais colunas em telas largas
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    padding: espaco.lg,
    alignItems: 'center',
    ...sombra,
  },
  indValor: { fontSize: 28, fontWeight: '800' },
  indTitulo: { color: cores.textoSuave, fontWeight: '600' },
  syncCard: { backgroundColor: cores.superficie, borderRadius: raio.md, padding: espaco.lg, gap: espaco.sm, ...sombra },
  syncTitulo: { fontSize: 16, fontWeight: '700', color: cores.texto },
  secao: { fontSize: 13, fontWeight: '700', color: cores.textoSuave, textTransform: 'uppercase' },
  mov: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    backgroundColor: cores.superficie,
    padding: espaco.md,
    borderRadius: raio.md,
    marginBottom: espaco.sm,
  },
  iconeMov: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  movTitulo: { fontWeight: '600', color: cores.texto },
  movSub: { fontSize: 12, color: cores.textoSuave },
});
