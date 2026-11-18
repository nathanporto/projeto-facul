import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useItens } from '@/context/ItensContext';
import { ItemCard } from '@/components/ItemCard';
import { Chip } from '@/components/Chip';
import { Carregando, EstadoVazio } from '@/components/EstadoTela';
import { CATEGORIAS, FILTROS_VALIDADE } from '@/constants/categorias';
import { filtrarItens } from '@/utils/filtros';
import type { Categoria, FiltroValidade, ItemExcedente } from '@/types';
import { cores, espaco, raio, sombra } from '@/theme';

/** Tela 1 — Lista de itens disponíveis com filtros por categoria e validade. */
export default function ListaItensScreen() {
  const { itens, carregando } = useItens();
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas');
  const [validade, setValidade] = useState<FiltroValidade>('todos');
  const [busca, setBusca] = useState('');

  // useMemo: só recalcula o filtro quando dados ou critérios mudam.
  const filtrados = useMemo(
    () => filtrarItens(itens, { categoria, validade, busca }),
    [itens, categoria, validade, busca],
  );
  const totalDisponiveis = useMemo(() => itens.filter((i) => i.status === 'disponivel').length, [itens]);

  // useCallback mantém a mesma referência entre renders, aproveitando o memo do ItemCard.
  const abrirDetalhes = useCallback(
    (id: string) => router.push({ pathname: '/item/[id]', params: { id } }),
    [],
  );
  const renderItem = useCallback(
    ({ item }: { item: ItemExcedente }) => <ItemCard item={item} onPress={abrirDetalhes} />,
    [abrirDetalhes],
  );

  if (carregando) return <Carregando mensagem="Carregando seus excedentes..." />;

  const filtrosAtivos = categoria !== 'todas' || validade !== 'todos' || busca.trim() !== '';

  return (
    <View style={styles.tela}>
      <FlatList
        data={filtrados}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.busca}>
              <Ionicons name="search" size={18} color={cores.textoSuave} />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar pela descrição"
                placeholderTextColor={cores.textoSuave}
                style={styles.inputBusca}
                returnKeyType="search"
                clearButtonMode="while-editing" // só tem efeito no iOS
              />
            </View>

            <Text style={styles.secao}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip rotulo="Todas" selecionado={categoria === 'todas'} onPress={() => setCategoria('todas')} />
              {CATEGORIAS.map((c) => (
                <Chip
                  key={c.valor}
                  rotulo={c.rotulo}
                  icone={c.icone}
                  selecionado={categoria === c.valor}
                  onPress={() => setCategoria(c.valor)}
                />
              ))}
            </ScrollView>

            <Text style={styles.secao}>Validade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FILTROS_VALIDADE.map((f) => (
                <Chip key={f.valor} rotulo={f.rotulo} selecionado={validade === f.valor} onPress={() => setValidade(f.valor)} />
              ))}
            </ScrollView>

            <Text style={styles.contador}>
              {filtrados.length} de {totalDisponiveis} item(ns) disponível(is)
            </Text>
          </View>
        }
        ListEmptyComponent={
          totalDisponiveis === 0 ? (
            <EstadoVazio
              titulo="Nenhum excedente cadastrado"
              mensagem="Cadastre sobras de alimentos para acompanhar a validade e registrar doações."
              acao={{ titulo: 'Cadastrar primeiro item', onPress: () => router.push('/item/novo') }}
            />
          ) : (
            <EstadoVazio
              icone="filter-outline"
              titulo="Nenhum item com esses filtros"
              mensagem="Tente outra categoria ou faixa de validade."
              acao={
                filtrosAtivos
                  ? {
                      titulo: 'Limpar filtros',
                      onPress: () => {
                        setCategoria('todas');
                        setValidade('todos');
                        setBusca('');
                      },
                    }
                  : undefined
              }
            />
          )
        }
      />

      {/* Botão flutuante (FAB) para o cadastro */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/item/novo')}
        accessibilityRole="button"
        accessibilityLabel="Cadastrar novo excedente"
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  lista: { padding: espaco.lg, paddingBottom: 96, flexGrow: 1 },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingHorizontal: espaco.md,
  },
  inputBusca: { flex: 1, paddingVertical: espaco.sm + 2, fontSize: 16, color: cores.texto },
  secao: { fontSize: 13, fontWeight: '700', color: cores.textoSuave, marginTop: espaco.md, marginBottom: espaco.sm, textTransform: 'uppercase' },
  contador: { color: cores.textoSuave, marginVertical: espaco.sm },
  fab: {
    position: 'absolute',
    right: espaco.lg,
    bottom: espaco.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
});
