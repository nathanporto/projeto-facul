import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBuscaProdutos } from '@/hooks/useBuscaProdutos';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/EstadoTela';
import { Botao } from '@/components/Botao';
import type { ProdutoReferencia } from '@/services/api';
import { cores, espaco, raio, sombra } from '@/theme';

/**
 * Tela 4 — Consulta à API REST pública Open Food Facts.
 * Demonstra os 4 estados: carregando, sucesso (lista), vazio e erro de comunicação.
 * Tocar em um resultado abre o cadastro com a descrição já preenchida.
 */
export default function ConsultaScreen() {
  const [termo, setTermo] = useState('');
  const { estado, buscar } = useBuscaProdutos();

  function usarProduto(p: ProdutoReferencia) {
    const descricao = p.marca !== 'Marca não informada' ? `${p.nome} (${p.marca})` : p.nome;
    router.push({ pathname: '/item/novo', params: { descricao: descricao.slice(0, 80) } });
  }

  function renderConteudo() {
    switch (estado.status) {
      case 'ocioso':
        return (
          <EstadoVazio
            icone="search-outline"
            titulo="Consulte a base Open Food Facts"
            mensagem="Pesquise um alimento (ex.: arroz, iogurte, pão) para ver dados de referência e cadastrá-lo como excedente."
          />
        );
      case 'carregando':
        return <Carregando mensagem="Consultando a API..." />;
      case 'vazio':
        return <EstadoVazio icone="sad-outline" titulo="Nenhum produto encontrado" mensagem="Tente outro termo de busca." />;
      case 'erro':
        return <EstadoErro mensagem={estado.mensagem} onTentarNovamente={() => void buscar(termo)} />;
      case 'sucesso':
        return (
          <FlatList
            data={estado.dados}
            keyExtractor={(p, i) => `${p.codigo}-${i}`}
            contentContainerStyle={{ padding: espaco.lg }}
            ListHeaderComponent={<Text style={styles.contador}>{estado.dados.length} resultado(s)</Text>}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => usarProduto(item)} accessibilityRole="button">
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} style={styles.img} resizeMode="contain" />
                ) : (
                  <View style={[styles.img, styles.semImg]}>
                    <Ionicons name="image-outline" size={24} color={cores.textoSuave} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome} numberOfLines={2}>{item.nome}</Text>
                  <Text style={styles.sub} numberOfLines={1}>{item.marca}</Text>
                  <Text style={styles.sub} numberOfLines={1}>{item.categorias}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={26} color={cores.primaria} />
              </Pressable>
            )}
          />
        );
    }
  }

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <TextInput
          value={termo}
          onChangeText={setTermo}
          placeholder="Nome do alimento"
          placeholderTextColor={cores.textoSuave}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => void buscar(termo)}
          autoCorrect={false}
        />
        <Botao titulo="Buscar" icone="search" onPress={() => void buscar(termo)} carregando={estado.status === 'carregando'} />
      </View>
      <View style={{ flex: 1 }}>{renderConteudo()}</View>
      <Text style={styles.fonte}>Dados: Open Food Facts (openfoodfacts.org) — licença ODbL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  barra: { flexDirection: 'row', gap: espaco.sm, padding: espaco.lg, paddingBottom: 0 },
  input: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    fontSize: 16,
    color: cores.texto,
  },
  contador: { color: cores.textoSuave, marginBottom: espaco.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    backgroundColor: cores.superficie,
    padding: espaco.md,
    borderRadius: raio.md,
    marginBottom: espaco.md,
    ...sombra,
  },
  img: { width: 56, height: 56, borderRadius: raio.sm, backgroundColor: '#FFF' },
  semImg: { backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 15, fontWeight: '700', color: cores.texto },
  sub: { fontSize: 12, color: cores.textoSuave },
  fonte: { fontSize: 11, color: cores.textoSuave, textAlign: 'center', padding: espaco.sm },
});
