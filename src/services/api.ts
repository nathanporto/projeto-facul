import Constants from 'expo-constants';
import type { ItemExcedente, Movimentacao } from '@/types';

/**
 * Camada de acesso a APIs REST.
 * - Consulta: Open Food Facts (base pública e aberta de alimentos), resposta JSON.
 * - Sincronização: endpoint REST configurável em app.json -> expo.extra.apiSyncUrl.
 *   Por padrão usamos o JSONPlaceholder, uma API pública para fins acadêmicos
 *   que aceita POST e devolve o objeto criado (simula um backend real).
 */

const OFF_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const SYNC_URL: string =
  (Constants.expoConfig?.extra?.apiSyncUrl as string | undefined) ??
  'https://jsonplaceholder.typicode.com/posts';

const TIMEOUT_MS = 12000;

/** Erro com mensagem já pronta para mostrar ao usuário. */
export class ErroApi extends Error {}

/** fetch com timeout: sem isso, uma rede ruim deixaria a tela "carregando" para sempre. */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    });
    if (!resp.ok) throw new ErroApi(`O servidor respondeu com erro (HTTP ${resp.status}).`);
    return (await resp.json()) as T;
  } catch (e) {
    if (e instanceof ErroApi) throw e;
    if ((e as Error).name === 'AbortError')
      throw new ErroApi('Tempo de resposta esgotado. Verifique sua conexão.');
    throw new ErroApi('Não foi possível conectar. Verifique sua internet e tente novamente.');
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- Consulta: Open Food Facts ---------------- */

/** Formato (parcial) do JSON devolvido pelo Open Food Facts. */
interface OffResposta {
  count: number;
  products: {
    code?: string;
    product_name?: string;
    brands?: string;
    categories?: string;
    image_small_url?: string;
  }[];
}

/** Modelo já tratado que a tela consome. */
export interface ProdutoReferencia {
  codigo: string;
  nome: string;
  marca: string;
  categorias: string;
  imagem?: string;
}

export async function buscarProdutos(termo: string): Promise<ProdutoReferencia[]> {
  const params = new URLSearchParams({
    search_terms: termo,
    search_simple: '1',
    json: '1',
    page_size: '25',
    lc: 'pt',
    fields: 'code,product_name,brands,categories,image_small_url',
  });
  const json = await fetchJson<OffResposta>(`${OFF_URL}?${params.toString()}`);
  // Processamento do JSON: descarta produtos sem nome e normaliza campos opcionais.
  return (json.products ?? [])
    .filter((p) => p.product_name && p.product_name.trim())
    .map((p, idx) => ({
      codigo: p.code ?? `sem-codigo-${idx}`,
      nome: p.product_name!.trim(),
      marca: p.brands?.split(',')[0]?.trim() || 'Marca não informada',
      categorias: p.categories?.split(',').slice(0, 2).join(', ').trim() || 'Sem categoria',
      imagem: p.image_small_url,
    }));
}

/* ---------------- Sincronização ---------------- */

interface SyncPayload {
  origem: 'desperdicio-zero';
  enviadoEm: string;
  itens: ItemExcedente[];
  movimentacoes: Movimentacao[];
}

interface SyncResposta {
  id: number | string;
}

/**
 * Envia um "snapshot" dos dados locais ao servidor.
 * Fotos não são enviadas (URI local não faz sentido no servidor).
 */
export async function sincronizar(
  itens: ItemExcedente[],
  movimentacoes: Movimentacao[],
): Promise<{ protocolo: string; enviadoEm: string }> {
  const enviadoEm = new Date().toISOString();
  const payload: SyncPayload = {
    origem: 'desperdicio-zero',
    enviadoEm,
    itens: itens.map(({ fotoUri: _foto, notificacaoId: _n, ...resto }) => resto),
    movimentacoes,
  };
  const resp = await fetchJson<SyncResposta>(SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(payload),
  });
  return { protocolo: String(resp.id), enviadoEm };
}
