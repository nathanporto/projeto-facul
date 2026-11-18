# Relatório Técnico — Desperdício Zero (Grupo 9)

**Disciplina:** Desenvolvimento Mobile, Projeto Integrador
**Integrantes:** Caio da Silva Costa · Guilherme Afonso Azambuja · Nathan Porto França · Pedro Henrique da Costa Araújo · Vinícius Henrique Garret Marinho
**Tecnologias:** React Native 0.88 · Expo SDK 58 · TypeScript 6 · Expo Router · AsyncStorage · expo-image-picker · expo-notifications · expo-file-system · Jest · EAS Build

---

## 1. Problema e proposta

Restaurantes, cozinhas institucionais e consumidores descartam alimentos que ainda poderiam ser aproveitados, muitas vezes porque ninguém percebe a validade se aproximando. O **Desperdício Zero** permite:

1. cadastrar cada excedente com descrição, categoria, quantidade, unidade, validade, foto e observações;
2. ver os itens disponíveis ordenados pela validade mais próxima, com filtros por categoria e faixa de validade;
3. receber uma **notificação na véspera do vencimento**;
4. registrar **doação, retirada ou descarte**, inclusive parciais (ex.: doar 2 kg de 3,5 kg);
5. consultar uma base pública de alimentos (Open Food Facts) para padronizar descrições;
6. acompanhar indicadores de impacto (% reaproveitado) e **sincronizar** os dados com um servidor REST.

## 2. Arquitetura

```
desperdicio-zero/
├── app.json                 # configuração Expo: nome, package, permissões, plugins
├── eas.json                 # perfis de build: development, preview (APK), production (AAB)
├── src/
│   ├── app/                 # TELAS (Expo Router: cada arquivo é uma rota)
│   │   ├── _layout.tsx      # Provider global + Stack Navigator
│   │   ├── (tabs)/          # Tab Navigator
│   │   │   ├── index.tsx    # Tela 1: lista + filtros (FlatList)
│   │   │   ├── consulta.tsx # Tela 4: consulta à API REST
│   │   │   └── historico.tsx# Tela 5: histórico, indicadores, sincronização
│   │   └── item/
│   │       ├── novo.tsx     # Tela 2: formulário de cadastro
│   │       └── [id].tsx     # Tela 3: detalhes + registro de destinação
│   ├── components/          # componentes reutilizáveis (Botao, CampoTexto, Chip, ItemCard...)
│   ├── context/             # estado global (ItensContext: useState + useEffect)
│   ├── hooks/               # hooks customizados (useBuscaProdutos)
│   ├── services/            # acesso a recursos externos: API, AsyncStorage, câmera, notificações
│   ├── utils/               # regras de negócio puras (datas, validação, filtros), testadas com Jest
│   ├── constants/           # categorias, unidades, filtros
│   ├── theme/               # cores, espaçamentos, sombra multiplataforma
│   └── types/               # tipos TypeScript do domínio
```

**Separação de responsabilidades:**

- **Telas** (`app/`) só montam a interface e reagem a eventos.
- **Contexto** concentra o estado compartilhado e a persistência.
- **Serviços** isolam tudo que depende do mundo externo (rede, disco, sensores). Isso permite trocar a API ou testar com *mocks*.
- **Utils** são funções puras, sem React, por isso fáceis de testar.

### Navegação (6 rotas, 5 telas)

```
Stack (raiz)
├── (tabs) ── Tabs: Excedentes | Consultar | Histórico
├── item/novo   (modal)
└── item/[id]   (rota dinâmica com parâmetro)
```

A navegação acontece por `router.push`, com parâmetros tipados (`{ pathname: '/item/[id]', params: { id } }`), pelas abas e pelo toque na notificação, que abre os detalhes do item.

## 3. TypeScript, componentes, props, estado e hooks

### 3.1 Tipos do domínio (`src/types/index.ts`)

```ts
/** Estado genérico de uma requisição assíncrona.
 *  A união discriminada obriga cada tela a tratar todos os casos. */
export type EstadoRequisicao<T> =
  | { status: 'ocioso' }
  | { status: 'carregando' }
  | { status: 'sucesso'; dados: T }
  | { status: 'vazio' }
  | { status: 'erro'; mensagem: string };
```

### 3.2 Componente reutilizável com props (`src/components/CampoTexto.tsx`)

```tsx
interface Props extends TextInputProps {   // herda TODAS as props do TextInput
  rotulo: string;
  erro?: string;                             // mensagem de validação
  dica?: string;
  ref?: Ref<TextInputInstance>;              // React 19: ref é prop comum
}
export function CampoTexto({ rotulo, erro, dica, style, ref, ...rest }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput ref={ref} style={[styles.input, erro ? styles.inputErro : null, style]} {...rest} />
      {erro ? <Text style={styles.erro}>{erro}</Text> : dica ? <Text style={styles.dica}>{dica}</Text> : null}
    </View>
  );
}
```

O mesmo componente é usado para descrição, quantidade (teclado decimal), validade (máscara DD/MM/AAAA), responsável e observações.

Outros componentes reutilizáveis: `Botao` (variantes, ícone, loading), `Chip` (filtros e seleções), `ItemCard` (com `memo`), `SeloValidade`, `SeletorFoto`, `Carregando`/`EstadoVazio`/`EstadoErro`.

### 3.3 useState + useEffect: carregar e persistir (`src/context/ItensContext.tsx`)

```tsx
const [itens, setItens] = useState<ItemExcedente[]>([]);
const [carregando, setCarregando] = useState(true);

// 1) Carrega uma única vez, ao abrir o app (dependências vazias).
useEffect(() => {
  let ativo = true;                       // evita setState após desmontar
  (async () => {
    const [i, m] = await Promise.all([storage.carregarItens(), storage.carregarMovimentacoes()]);
    if (ativo) { setItens(i); setMovimentacoes(m); setCarregando(false); }
  })();
  return () => { ativo = false; };
}, []);

// 2) Salva sempre que "itens" muda, mas só depois do carregamento inicial.
//    Sem essa condição, a lista vazia inicial sobrescreveria os dados salvos.
useEffect(() => {
  if (!carregando) void storage.salvarItens(itens);
}, [itens, carregando]);
```

Também são usados: `useMemo` (filtro da lista e indicadores), `useCallback` (callbacks estáveis para a FlatList), `useRef` (foco entre campos; descartar respostas antigas da API), `useContext` (via hook `useItens`) e o hook customizado `useBuscaProdutos`.

## 4. Interface, formulário, validação e FlatList

- **StyleSheet + Flexbox:** cards em `flexDirection: 'row'` (foto | informações com `flex: 1` | seta); quantidade e validade lado a lado com `flex: 1`; grade de indicadores com `flexWrap` e `flexBasis: '40%'`, que se adapta à largura da tela.
- **Formulário** (`item/novo.tsx`): TextInputs controlados, máscara de data, teclado numérico, botão "próximo" do teclado move o foco, contador de caracteres e `KeyboardAvoidingView`.
- **Validação** (`utils/validacao.ts`) feita por funções puras:

```ts
if (!v.validade.trim()) erros.validade = 'Informe a data de validade.';
else {
  const iso = brParaIso(v.validade);               // retorna null para 31/02/2026
  if (!iso) erros.validade = 'Data inválida. Use o formato DD/MM/AAAA.';
  else if (diasParaVencer(iso, agora) < -30)
    erros.validade = 'Validade vencida há mais de 30 dias — registre como descarte.';
}
```

  O registro de destinação também é validado: a quantidade não pode passar do disponível, e uma doação exige o nome da instituição.
- **FlatList** em três telas (excedentes, resultados da API, histórico), com `keyExtractor`, `ListHeaderComponent` (filtros), `ListEmptyComponent` (estado vazio com ação) e `ItemCard` memoizado.

## 5. API REST, JSON e estados

### 5.1 Consulta: Open Food Facts

`GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=...&json=1`. O JSON é **processado**: produtos sem nome são descartados, a primeira marca é extraída e as categorias são reduzidas a duas.

```ts
return (json.products ?? [])
  .filter((p) => p.product_name && p.product_name.trim())
  .map((p, idx) => ({
    codigo: p.code ?? `sem-codigo-${idx}`,
    nome: p.product_name!.trim(),
    marca: p.brands?.split(',')[0]?.trim() || 'Marca não informada',
    categorias: p.categories?.split(',').slice(0, 2).join(', ').trim() || 'Sem categoria',
    imagem: p.image_small_url,
  }));
```

Ao tocar em um resultado, o cadastro abre com a descrição preenchida.

### 5.2 Sincronização: POST

`POST` para a URL em `app.json > extra.apiSyncUrl` (padrão: JSONPlaceholder, API pública para fins acadêmicos). Envia itens e movimentações em JSON, sem as URIs locais das fotos. O protocolo devolvido pelo servidor é exibido ao usuário e cada item recebe `sincronizadoEm`.

### 5.3 Tratamento dos estados

| Estado | Como aparece |
|--------|--------------|
| Carregando | `ActivityIndicator` com mensagem; botão "Buscar" em modo loading |
| Sucesso | FlatList com contador de resultados |
| Ausência de dados | `EstadoVazio` ("Nenhum produto encontrado") |
| Erro de comunicação | `EstadoErro` com mensagem amigável e botão **Tentar novamente** |

Erros de rede, HTTP (ex.: 503) e **timeout de 12 s** (via `AbortController`) viram `ErroApi` com texto em português. O hook descarta respostas de buscas antigas (condição de corrida).

## 6. Persistência local

`AsyncStorage` com chaves versionadas (`@dz/itens:v1`, `@dz/movimentacoes:v1`). Os dados são serializados em JSON, e um JSON corrompido é tratado sem derrubar o app. As fotos são **copiadas do cache do picker para `Paths.document/fotos`** com `expo-file-system`, porque o sistema pode limpar o cache. Ao excluir um item, a foto e o aviso agendado também são removidos.

## 7. Recursos do dispositivo e permissões

### 7.1 Câmera e galeria (`expo-image-picker`)

1. O usuário toca na área de foto e escolhe a origem: ActionSheet nativo no iOS, Alert no Android.
2. O app pede a permissão correspondente.
3. Se negada e `canAskAgain === false`, o app explica o motivo e oferece **Abrir configurações** (`Linking.openSettings()`).
4. As mensagens de permissão do iOS estão em `app.json` (`cameraPermission`, `photosPermission`), e o microfone foi bloqueado (`microphonePermission: false`) porque não é usado.

### 7.2 Notificação de validade (`expo-notifications`)

- A permissão é pedida **no contexto certo**: ao salvar o primeiro item, depois de um Alert que explica o motivo ("Vamos avisar um dia antes de cada item vencer...").
- O aviso é agendado para a **véspera às 09:00**. Se essa hora já passou, vai para o próprio dia às 09:00; se também passou, não é agendado.
- No Android, um canal `validade` com importância alta é criado (obrigatório no Android 8+; no Android 13+ o pedido de permissão só aparece depois que existe um canal).
- O aviso é cancelado quando o item é totalmente destinado ou excluído.
- Tocar na notificação abre os detalhes do item (`addNotificationResponseReceivedListener`).

## 8. Multiplataforma

| Técnica | Exemplo |
|---------|---------|
| `Platform.select` | Sombra: `elevation` no Android, `shadow*` no iOS, `boxShadow` na web (`theme/index.ts`) |
| `Platform.OS` | `KeyboardAvoidingView` com `padding` no iOS; ActionSheet (iOS) × Alert (Android) |
| **Arquivo por plataforma** | `notificacoes.ts` (nativo) × `notificacoes.web.ts`: mesma interface, o Metro escolhe pelo sufixo |
| Props específicas | `android_ripple` (Android), `clearButtonMode` (iOS) |
| Código compartilhado | 100% das telas, componentes, regras e serviços são comuns; apenas os pontos acima variam |

O app também roda na **web** (`npx expo start --web`), o que foi usado para testar os fluxos durante o desenvolvimento.

## 9. Builds, assinatura, versionamento e testes

### 9.1 Perfis (`eas.json`)

| Perfil | Finalidade | Artefato |
|--------|-----------|----------|
| `development` | Development Build com `expo-dev-client` (inclui módulos nativos e permite hot reload) | APK interno |
| `preview` | Distribuição para testes/instalação direta | APK (`buildType: "apk"`) |
| `production` | Publicação na Google Play | AAB (`buildType: "app-bundle"`) |

```bash
npm run build:dev   # eas build --profile development --platform android
npm run build:apk   # eas build --profile preview --platform android
npm run build:aab   # eas build --profile production --platform android
```

### 9.2 Assinatura Android

- Todo APK/AAB precisa ser **assinado digitalmente** com uma *keystore* (par de chaves). Ela comprova a autoria e garante que uma atualização venha do mesmo desenvolvedor: o Android recusa atualizar um app assinado com outra chave.
- No primeiro build, o EAS **gera e guarda a keystore** com segurança (`eas credentials` permite ver ou baixar um backup). Arquivos `*.jks` e `*.keystore` estão no `.gitignore` e nunca vão para o repositório.
- Na Play Store usamos **Play App Signing**: o AAB é assinado com a *upload key* (a do EAS), e o Google reassina o APK final com a *app signing key*. Se a upload key for perdida, ela pode ser redefinida pelo suporte do Google.
- **APK × AAB:** o APK é instalável diretamente. O AAB é um formato de publicação: a Play Store gera, a partir dele, APKs otimizados para cada dispositivo (ABI, densidade, idioma).

### 9.3 Versionamento

- `version` (`app.json`, ex.: `1.0.0`) é a versão **visível ao usuário** (versionName), segundo SemVer: MAJOR.MINOR.PATCH.
- `versionCode` (Android) é um **inteiro que precisa crescer** a cada envio à Play Store. Com `"appVersionSource": "remote"` e `"autoIncrement": true` no perfil `production`, o EAS guarda e incrementa esse número sozinho, o que evita rejeição por versionCode repetido.

### 9.4 Testes antes da publicação

1. **Testes automatizados (Jest + jest-expo):** 20 testes em 4 suítes cobrem datas e máscara, validação do formulário e da destinação, filtros e ordenação, e a camada de API com `fetch` simulado (processamento de JSON, erro HTTP, falha de rede e POST sem fotos).
2. **Verificação estática:** `npm run typecheck` (TypeScript estrito) e `npx expo-doctor` (20/20 verificações).
3. **Teste manual no Development Build**, seguindo o roteiro abaixo.
4. **Teste do APK de preview** instalado em aparelho real antes de gerar o AAB.

```
Test Suites: 4 passed, 4 total
Tests:       20 passed, 20 total
```

**Roteiro de teste manual**

| # | Passo | Resultado esperado | OK? |
|---|-------|--------------------|-----|
| 1 | Salvar formulário vazio | Mensagens de erro em vermelho em cada campo | |
| 2 | Validade 31/02/2026 | "Data inválida" | |
| 3 | Cadastrar item com foto da câmera | Pede permissão, foto aparece no card | |
| 4 | Negar a câmera duas vezes | Alert com "Abrir configurações" | |
| 5 | Fechar e reabrir o app | Itens continuam lá (AsyncStorage) | |
| 6 | Filtro "Até 3 dias" + categoria | Lista filtrada; vazio mostra "Limpar filtros" | |
| 7 | Cadastrar item vencendo amanhã | Notificação chega às 09:00 de hoje/amanhã | |
| 8 | Doar parte da quantidade | Saldo reduz, histórico registra | |
| 9 | Consulta com modo avião | Estado de erro + "Tentar novamente" | |
| 10 | Consulta "iogurte" | Lista de produtos; tocar preenche o cadastro | |
| 11 | Sincronizar | Alert com protocolo; detalhes mostram data de sincronização | |

## 10. Evidências

> Inserir aqui os prints capturados pelo grupo:
>
> - [ ] Lista de excedentes com filtros
> - [ ] Formulário com erros de validação
> - [ ] Diálogo de permissão da câmera / notificação
> - [ ] Notificação de validade recebida
> - [ ] Tela de detalhes com registro de doação
> - [ ] Consulta à API: sucesso, vazio e erro
> - [ ] Histórico e indicadores após sincronização
> - [ ] Página do build no expo.dev (development, preview e production)
> - [ ] APK instalado no aparelho
> - [ ] Saída de `npm test` e `npx expo-doctor`

## 11. Conclusão

O projeto aplica os conteúdos da disciplina em um problema real. Há componentização com TypeScript estrito, estado com hooks, navegação em pilha e por abas, formulário validado, FlatList com filtros, consumo e processamento de API REST com todos os estados tratados, persistência local, câmera e notificações com permissões explicadas, adaptações por plataforma e o ciclo completo de build Android (development, APK e AAB) com assinatura e versionamento gerenciados pelo EAS.
