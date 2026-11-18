# Desperdício Zero — Grupo 9

Aplicativo mobile (React Native + Expo SDK 58 + TypeScript) para registrar **excedentes de alimentos**, acompanhar a **validade** e registrar **retirada, doação ou descarte**.

**Integrantes:** Caio da Silva Costa · Guilherme Afonso Azambuja · Nathan Porto França · Pedro Henrique da Costa Araújo · Vinícius Henrique Garret Marinho

## Funcionalidades

| # | Requisito | Onde está |
|---|-----------|-----------|
| 57 | Cadastro de excedente (descrição, quantidade, validade, foto) | `src/app/item/novo.tsx` |
| 58 | Lista com FlatList | `src/app/(tabs)/index.tsx` |
| 59 | Filtros por categoria e validade (+ busca) | `src/app/(tabs)/index.tsx`, `src/utils/filtros.ts` |
| 60 | Tela de detalhes | `src/app/item/[id].tsx` |
| 61 | Registro de retirada, doação ou descarte | `src/app/item/[id].tsx`, `src/context/ItensContext.tsx` |
| 62 | Persistência local (AsyncStorage) | `src/services/storage.ts` |
| 63 | API REST: consulta (Open Food Facts) e sincronização (POST) | `src/services/api.ts`, `src/app/(tabs)/consulta.tsx`, `src/app/(tabs)/historico.tsx` |
| — | Câmera/galeria | `src/services/fotos.ts`, `src/components/SeletorFoto.tsx` |
| — | Notificação de validade | `src/services/notificacoes.ts` (+ `.web.ts`) |

## Pré-requisitos

- **Node.js ≥ 22.13** (o SDK 58 não roda no Node 20). Com nvm: `nvm use 22.15.0`
- Conta Expo (gratuita) para os builds EAS

## Rodar em desenvolvimento

```bash
npm install
```

```bash
npx expo start
```

Câmera e notificações locais funcionam no Expo Go, mas o projeto inclui `expo-dev-client`; o fluxo recomendado é usar o **Development Build** (abaixo) e iniciar com:

```bash
npx expo start --dev-client
```

## Qualidade (rodar antes de cada build)

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npx expo-doctor
```

## Builds com EAS

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

| Objetivo | Comando | Saída |
|----------|---------|-------|
| Development Build | `npm run build:dev` | APK com dev client (instalação interna) |
| APK para distribuição/instalação | `npm run build:apk` | `.apk` (perfil `preview`) |
| AAB de produção (Play Store) | `npm run build:aab` | `.aab` (perfil `production`, versionCode auto-incrementado) |

Na primeira execução, o EAS pergunta se deve **gerar a keystore Android**: responda *Yes*. Ela fica guardada nos servidores da Expo e é reutilizada em todos os builds (veja `npx eas-cli@latest credentials`).

Relatório técnico completo: [docs/RELATORIO_TECNICO.md](docs/RELATORIO_TECNICO.md).
