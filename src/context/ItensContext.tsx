import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  ItemExcedente,
  Movimentacao,
  NovaMovimentacaoInput,
  NovoItemInput,
  StatusItem,
  TipoMovimentacao,
} from '@/types';
import { storage } from '@/services/storage';
import { agendarAvisoValidade, cancelarAviso } from '@/services/notificacoes';
import { apagarFoto } from '@/services/fotos';
import { gerarId } from '@/utils/id';

/**
 * Estado global de itens e movimentações, compartilhado entre todas as telas.
 * - useState guarda os dados em memória;
 * - useEffect carrega do AsyncStorage na abertura e salva a cada alteração.
 */
interface ItensContextValor {
  itens: ItemExcedente[];
  movimentacoes: Movimentacao[];
  carregando: boolean;
  adicionarItem: (dados: NovoItemInput) => Promise<ItemExcedente>;
  removerItem: (id: string) => Promise<void>;
  registrarMovimentacao: (itemId: string, dados: NovaMovimentacaoInput) => Promise<void>;
  marcarSincronizado: (dataIso: string) => void;
  obterItem: (id: string) => ItemExcedente | undefined;
}

const ItensContext = createContext<ItensContextValor | null>(null);

/** Status final do item quando sua quantidade zera, conforme o tipo de destinação. */
const STATUS_POR_TIPO: Record<TipoMovimentacao, StatusItem> = {
  retirada: 'retirado',
  doacao: 'doado',
  descarte: 'descartado',
};

export function ItensProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemExcedente[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // 1) Carregar dados persistidos uma única vez (array de dependências vazio).
  useEffect(() => {
    let ativo = true; // evita setState após desmontar
    (async () => {
      const [i, m] = await Promise.all([storage.carregarItens(), storage.carregarMovimentacoes()]);
      if (ativo) {
        setItens(i);
        setMovimentacoes(m);
        setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // 2) Persistir sempre que os dados mudarem — mas só depois do carregamento inicial,
  //    senão sobrescreveríamos o armazenamento com a lista vazia inicial.
  useEffect(() => {
    if (!carregando) void storage.salvarItens(itens);
  }, [itens, carregando]);

  useEffect(() => {
    if (!carregando) void storage.salvarMovimentacoes(movimentacoes);
  }, [movimentacoes, carregando]);

  const adicionarItem = useCallback(async (dados: NovoItemInput) => {
    const base: ItemExcedente = {
      ...dados,
      id: gerarId(),
      quantidadeInicial: dados.quantidade,
      status: 'disponivel',
      criadoEm: new Date().toISOString(),
    };
    // Agenda o aviso de validade; se não houver permissão, simplesmente não agenda.
    const notificacaoId = await agendarAvisoValidade(base).catch(() => undefined);
    const novo = { ...base, notificacaoId };
    setItens((atual) => [novo, ...atual]); // forma funcional: sempre usa o estado mais recente
    return novo;
  }, []);

  const removerItem = useCallback(
    async (id: string) => {
      const removido = itens.find((i) => i.id === id);
      setItens((atual) => atual.filter((i) => i.id !== id));
      if (removido) {
        await cancelarAviso(removido.notificacaoId);
        apagarFoto(removido.fotoUri);
      }
    },
    [itens],
  );

  const registrarMovimentacao = useCallback(
    async (itemId: string, dados: NovaMovimentacaoInput) => {
      const item = itens.find((i) => i.id === itemId);
      if (!item) return;
      const restante = Math.max(0, +(item.quantidade - dados.quantidade).toFixed(3));
      const encerrado = restante === 0;

      const mov: Movimentacao = {
        ...dados,
        id: gerarId(),
        itemId,
        itemDescricao: item.descricao,
        unidade: item.unidade,
        data: new Date().toISOString(),
      };
      setMovimentacoes((atual) => [mov, ...atual]);
      setItens((atual) =>
        atual.map((i) =>
          i.id === itemId
            ? {
                ...i,
                quantidade: restante,
                status: encerrado ? STATUS_POR_TIPO[dados.tipo] : 'disponivel',
                notificacaoId: encerrado ? undefined : i.notificacaoId,
              }
            : i,
        ),
      );
      // Item encerrado não precisa mais do aviso de validade.
      if (encerrado) await cancelarAviso(item.notificacaoId);
    },
    [itens],
  );

  const marcarSincronizado = useCallback((dataIso: string) => {
    setItens((atual) => atual.map((i) => ({ ...i, sincronizadoEm: dataIso })));
  }, []);

  const obterItem = useCallback((id: string) => itens.find((i) => i.id === id), [itens]);

  // useMemo evita recriar o objeto do contexto (e re-renderizar consumidores) sem necessidade.
  const valor = useMemo(
    () => ({
      itens,
      movimentacoes,
      carregando,
      adicionarItem,
      removerItem,
      registrarMovimentacao,
      marcarSincronizado,
      obterItem,
    }),
    [itens, movimentacoes, carregando, adicionarItem, removerItem, registrarMovimentacao, marcarSincronizado, obterItem],
  );

  return <ItensContext.Provider value={valor}>{children}</ItensContext.Provider>;
}

/** Hook customizado: dá erro claro se usado fora do Provider. */
export function useItens(): ItensContextValor {
  const ctx = useContext(ItensContext);
  if (!ctx) throw new Error('useItens deve ser usado dentro de <ItensProvider>.');
  return ctx;
}
