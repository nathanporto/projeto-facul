import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useItens } from '@/context/ItensContext';
import { voltarOuIrParaLista } from '@/utils/navegacao';
import { CampoTexto } from '@/components/CampoTexto';
import { Chip } from '@/components/Chip';
import { Botao } from '@/components/Botao';
import { SeletorFoto } from '@/components/SeletorFoto';
import { CATEGORIAS, UNIDADES } from '@/constants/categorias';
import { garantirPermissaoNotificacao } from '@/services/notificacoes';
import { brParaIso, mascaraData } from '@/utils/datas';
import { parseNumero, temErros, validarItem, type ErrosForm, type FormItemValores } from '@/utils/validacao';
import type { Categoria, Unidade } from '@/types';
import { cores, espaco } from '@/theme';

/**
 * Tela 2 — Cadastro de item excedente (formulário com TextInput + validação).
 * Pode receber `descricao` por parâmetro quando aberta a partir da consulta à API.
 */
export default function NovoItemScreen() {
  const params = useLocalSearchParams<{ descricao?: string }>();
  const { adicionarItem } = useItens();

  // Estado controlado do formulário: cada TextInput lê e escreve aqui.
  const [valores, setValores] = useState<FormItemValores>({
    descricao: params.descricao ?? '',
    quantidade: '',
    validade: '',
    observacoes: '',
  });
  const [categoria, setCategoria] = useState<Categoria>('hortifruti');
  const [unidade, setUnidade] = useState<Unidade>('kg');
  const [fotoUri, setFotoUri] = useState<string>();
  const [erros, setErros] = useState<ErrosForm<FormItemValores>>({});
  const [salvando, setSalvando] = useState(false);

  // Refs para pular de um campo ao próximo pelo botão "próximo" do teclado.
  const refQuantidade = useRef<TextInputInstance>(null);
  const refValidade = useRef<TextInputInstance>(null);

  function alterar<K extends keyof FormItemValores>(campo: K, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    // Limpa o erro do campo assim que o usuário corrige.
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function salvar() {
    const encontrados = validarItem(valores);
    // Remove chaves undefined para que temErros funcione corretamente.
    const limpos = Object.fromEntries(Object.entries(encontrados).filter(([, v]) => v)) as typeof encontrados;
    setErros(limpos);
    if (temErros(limpos)) {
      Alert.alert('Verifique o formulário', 'Alguns campos precisam ser corrigidos.');
      return;
    }

    setSalvando(true);
    try {
      // Pede permissão de notificação de forma contextual (no momento em que faz sentido).
      await garantirPermissaoNotificacao();
      const item = await adicionarItem({
        descricao: valores.descricao.trim(),
        quantidade: parseNumero(valores.quantidade),
        validade: brParaIso(valores.validade)!,
        observacoes: valores.observacoes.trim() || undefined,
        categoria,
        unidade,
        fotoUri,
      });
      Alert.alert(
        'Item cadastrado',
        item.notificacaoId
          ? 'Você será avisado na véspera do vencimento.'
          : 'Item salvo. (Aviso de validade não agendado: sem permissão ou data muito próxima.)',
      );
      voltarOuIrParaLista();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o item. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    // KeyboardAvoidingView: no iOS precisamos de "padding"; no Android o sistema já redimensiona a tela.
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <SeletorFoto uri={fotoUri} onChange={setFotoUri} />

        <CampoTexto
          rotulo="Descrição *"
          placeholder="Ex.: Pães franceses do dia"
          value={valores.descricao}
          onChangeText={(t) => alterar('descricao', t)}
          erro={erros.descricao}
          maxLength={80}
          returnKeyType="next"
          onSubmitEditing={() => refQuantidade.current?.focus()}
        />

        <Text style={styles.rotulo}>Categoria *</Text>
        <View style={styles.chips}>
          {CATEGORIAS.map((c) => (
            <Chip key={c.valor} rotulo={c.rotulo} icone={c.icone} selecionado={categoria === c.valor} onPress={() => setCategoria(c.valor)} />
          ))}
        </View>

        {/* Linha com dois campos lado a lado usando Flexbox */}
        <View style={styles.linha}>
          <View style={{ flex: 1 }}>
            <CampoTexto
              ref={refQuantidade}
              rotulo="Quantidade *"
              placeholder="Ex.: 2,5"
              keyboardType="decimal-pad"
              value={valores.quantidade}
              onChangeText={(t) => alterar('quantidade', t.replace(/[^0-9.,]/g, ''))}
              erro={erros.quantidade}
              returnKeyType="next"
              onSubmitEditing={() => refValidade.current?.focus()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CampoTexto
              ref={refValidade}
              rotulo="Validade *"
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              value={valores.validade}
              onChangeText={(t) => alterar('validade', mascaraData(t))}
              erro={erros.validade}
              maxLength={10}
            />
          </View>
        </View>

        <Text style={styles.rotulo}>Unidade</Text>
        <View style={styles.chips}>
          {UNIDADES.map((u) => (
            <Chip key={u} rotulo={u} selecionado={unidade === u} onPress={() => setUnidade(u)} />
          ))}
        </View>

        <CampoTexto
          rotulo="Observações"
          placeholder="Condições de armazenamento, alergênicos, local de retirada..."
          value={valores.observacoes}
          onChangeText={(t) => alterar('observacoes', t)}
          erro={erros.observacoes}
          dica={`${valores.observacoes.length}/300`}
          multiline
          maxLength={300}
        />

        <Botao titulo="Salvar excedente" icone="checkmark" onPress={salvar} carregando={salvando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: espaco.lg, paddingBottom: espaco.xl * 2 },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto, marginBottom: espaco.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: espaco.sm },
  linha: { flexDirection: 'row', gap: espaco.md },
});
