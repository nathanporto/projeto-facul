import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useItens } from '@/context/ItensContext';
import { voltarOuIrParaLista } from '@/utils/navegacao';
import { Botao } from '@/components/Botao';
import { CampoTexto } from '@/components/CampoTexto';
import { Chip } from '@/components/Chip';
import { EstadoVazio } from '@/components/EstadoTela';
import { SeloValidade } from '@/components/SeloValidade';
import { rotuloCategoria, rotuloMovimentacao, TIPOS_MOVIMENTACAO } from '@/constants/categorias';
import { formatarDataHora, isoParaBr } from '@/utils/datas';
import { parseNumero, temErros, validarMovimentacao } from '@/utils/validacao';
import type { TipoMovimentacao } from '@/types';
import { cores, espaco, raio, sombra } from '@/theme';

const STATUS_ROTULO = { disponivel: 'Disponível', retirado: 'Retirado', doado: 'Doado', descartado: 'Descartado' } as const;

/** Tela 3 — Detalhes do item + registro de retirada, doação ou descarte. */
export default function DetalhesItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { obterItem, registrarMovimentacao, removerItem, movimentacoes } = useItens();
  const item = obterItem(id);

  const [tipo, setTipo] = useState<TipoMovimentacao>('doacao');
  const [quantidade, setQuantidade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [destino, setDestino] = useState('');
  const [erros, setErros] = useState<Record<string, string | undefined>>({});
  const [salvando, setSalvando] = useState(false);

  if (!item) {
    return (
      <EstadoVazio
        icone="alert-circle-outline"
        titulo="Item não encontrado"
        mensagem="Ele pode ter sido excluído."
        acao={{ titulo: 'Voltar', onPress: () => voltarOuIrParaLista() }}
      />
    );
  }

  const historicoItem = movimentacoes.filter((m) => m.itemId === item.id);
  const disponivel = item.status === 'disponivel';

  async function registrar() {
    if (!item) return;
    const e = validarMovimentacao({ quantidade, responsavel, tipo, destino }, item);
    setErros(e);
    if (temErros(e)) return;

    const q = parseNumero(quantidade);
    const confirmar = async () => {
      setSalvando(true);
      await registrarMovimentacao(item.id, {
        tipo,
        quantidade: q,
        responsavel: responsavel.trim(),
        destino: tipo === 'doacao' ? destino.trim() : undefined,
      });
      setSalvando(false);
      setQuantidade('');
      setDestino('');
      Alert.alert('Registro salvo', `${rotuloMovimentacao(tipo)} de ${q} ${item.unidade} registrada.`);
    };
    // Descarte é a destinação que queremos evitar — pedimos confirmação.
    if (tipo === 'descarte') {
      Alert.alert('Confirmar descarte', 'O descarte deve ser a última opção. Deseja continuar?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => void confirmar() },
      ]);
    } else {
      await confirmar();
    }
  }

  function excluir() {
    Alert.alert('Excluir item', 'Isso remove o item e o aviso de validade. O histórico de registros é mantido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await removerItem(item!.id);
          voltarOuIrParaLista();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Define o título da barra dinamicamente com a descrição do item */}
      <Stack.Screen options={{ title: item.descricao }} />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        {item.fotoUri ? (
          <Image source={{ uri: item.fotoUri }} style={styles.foto} accessibilityLabel={`Foto de ${item.descricao}`} />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.titulo}>{item.descricao}</Text>
          <SeloValidade validade={item.validade} />
          <Linha icone="pricetag-outline" rotulo="Categoria" valor={rotuloCategoria(item.categoria)} />
          <Linha icone="cube-outline" rotulo="Disponível" valor={`${item.quantidade} de ${item.quantidadeInicial} ${item.unidade}`} />
          <Linha icone="calendar-outline" rotulo="Validade" valor={isoParaBr(item.validade)} />
          <Linha icone="flag-outline" rotulo="Situação" valor={STATUS_ROTULO[item.status]} />
          <Linha icone="time-outline" rotulo="Cadastrado em" valor={formatarDataHora(item.criadoEm)} />
          <Linha
            icone="notifications-outline"
            rotulo="Aviso de validade"
            valor={item.notificacaoId ? 'Agendado' : 'Não agendado'}
          />
          <Linha
            icone="cloud-done-outline"
            rotulo="Sincronizado"
            valor={item.sincronizadoEm ? formatarDataHora(item.sincronizadoEm) : 'Ainda não'}
          />
          {item.observacoes ? <Text style={styles.obs}>{item.observacoes}</Text> : null}
        </View>

        {disponivel && (
          <View style={styles.card}>
            <Text style={styles.subtitulo}>Registrar destinação</Text>
            <View style={styles.chips}>
              {TIPOS_MOVIMENTACAO.map((t) => (
                <Chip key={t.valor} rotulo={t.rotulo} icone={t.icone} selecionado={tipo === t.valor} onPress={() => setTipo(t.valor)} />
              ))}
            </View>
            <CampoTexto
              rotulo={`Quantidade (${item.unidade}) *`}
              placeholder={`Máx. ${item.quantidade}`}
              keyboardType="decimal-pad"
              value={quantidade}
              onChangeText={(t) => setQuantidade(t.replace(/[^0-9.,]/g, ''))}
              erro={erros.quantidade}
            />
            <Botao
              titulo="Usar tudo"
              variante="secundario"
              onPress={() => setQuantidade(String(item.quantidade).replace('.', ','))}
              estilo={{ marginBottom: espaco.md }}
            />
            <CampoTexto
              rotulo="Responsável *"
              placeholder="Quem realizou a ação"
              value={responsavel}
              onChangeText={setResponsavel}
              erro={erros.responsavel}
            />
            {tipo === 'doacao' && (
              <CampoTexto
                rotulo="Instituição / beneficiário *"
                placeholder="Ex.: Banco de Alimentos"
                value={destino}
                onChangeText={setDestino}
                erro={erros.destino}
              />
            )}
            <Botao
              titulo={`Registrar ${rotuloMovimentacao(tipo).toLowerCase()}`}
              variante={tipo === 'descarte' ? 'perigo' : 'primario'}
              icone="checkmark-done"
              onPress={registrar}
              carregando={salvando}
            />
          </View>
        )}

        {historicoItem.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.subtitulo}>Registros deste item</Text>
            {historicoItem.map((m) => (
              <Text key={m.id} style={styles.historico}>
                • {formatarDataHora(m.data)} — {rotuloMovimentacao(m.tipo)} de {m.quantidade} {m.unidade} por {m.responsavel}
                {m.destino ? ` → ${m.destino}` : ''}
              </Text>
            ))}
          </View>
        )}

        <Botao titulo="Excluir item" variante="perigo" icone="trash" onPress={excluir} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Componente local para uma linha "ícone · rótulo · valor". */
function Linha({ icone, rotulo, valor }: { icone: keyof typeof Ionicons.glyphMap; rotulo: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icone} size={18} color={cores.primaria} />
      <Text style={styles.linhaRotulo}>{rotulo}</Text>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: espaco.lg, gap: espaco.lg, paddingBottom: espaco.xl * 2 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: raio.md },
  card: { backgroundColor: cores.superficie, borderRadius: raio.md, padding: espaco.lg, gap: espaco.sm, ...sombra },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 17, fontWeight: '700', color: cores.texto, marginBottom: espaco.xs },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  linhaRotulo: { color: cores.textoSuave, width: 130 },
  linhaValor: { flex: 1, color: cores.texto, fontWeight: '600', textAlign: 'right' },
  obs: { marginTop: espaco.sm, color: cores.texto, fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  historico: { color: cores.texto, lineHeight: 20 },
});
