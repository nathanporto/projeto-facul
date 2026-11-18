import { useCallback, useEffect, useRef, useState } from 'react';
import { buscarProdutos, ErroApi, type ProdutoReferencia } from '@/services/api';
import type { EstadoRequisicao } from '@/types';

/**
 * Hook que encapsula a consulta à API REST e expõe um estado único
 * (ocioso | carregando | sucesso | vazio | erro) para a tela renderizar.
 */
export function useBuscaProdutos() {
  const [estado, setEstado] = useState<EstadoRequisicao<ProdutoReferencia[]>>({ status: 'ocioso' });
  const ultimaBusca = useRef(0); // ignora respostas de buscas antigas (condição de corrida)
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const buscar = useCallback(async (termo: string) => {
    const t = termo.trim();
    if (t.length < 2) {
      setEstado({ status: 'erro', mensagem: 'Digite pelo menos 2 letras para buscar.' });
      return;
    }
    const idBusca = ++ultimaBusca.current;
    setEstado({ status: 'carregando' });
    try {
      const dados = await buscarProdutos(t);
      if (!montado.current || idBusca !== ultimaBusca.current) return;
      setEstado(dados.length ? { status: 'sucesso', dados } : { status: 'vazio' });
    } catch (e) {
      if (!montado.current || idBusca !== ultimaBusca.current) return;
      setEstado({
        status: 'erro',
        mensagem: e instanceof ErroApi ? e.message : 'Erro inesperado ao consultar a API.',
      });
    }
  }, []);

  return { estado, buscar };
}
