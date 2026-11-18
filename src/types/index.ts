/**
 * Tipos de domínio do Desperdício Zero.
 * Centralizar os tipos aqui garante que telas, serviços e testes falem a mesma "língua".
 */

/** Categorias de alimentos usadas no cadastro e no filtro da lista. */
export type Categoria =
  | 'hortifruti'
  | 'padaria'
  | 'laticinios'
  | 'carnes'
  | 'graos'
  | 'preparados'
  | 'bebidas'
  | 'outros';

export type Unidade = 'un' | 'kg' | 'g' | 'L';

/** Situação do item: só "disponivel" aparece na lista principal por padrão. */
export type StatusItem = 'disponivel' | 'retirado' | 'doado' | 'descartado';

/** Tipos de destinação que podem ser registrados para um excedente. */
export type TipoMovimentacao = 'retirada' | 'doacao' | 'descarte';

/** Item excedente cadastrado pelo usuário. */
export interface ItemExcedente {
  id: string;
  descricao: string;
  categoria: Categoria;
  quantidade: number; // quantidade ainda disponível
  quantidadeInicial: number;
  unidade: Unidade;
  validade: string; // data ISO "AAAA-MM-DD"
  fotoUri?: string;
  observacoes?: string;
  status: StatusItem;
  criadoEm: string; // ISO date-time
  notificacaoId?: string; // id da notificação local agendada
  sincronizadoEm?: string; // última sincronização com a API
}

/** Registro de retirada, doação ou descarte de (parte de) um item. */
export interface Movimentacao {
  id: string;
  itemId: string;
  itemDescricao: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  unidade: Unidade;
  responsavel: string;
  destino?: string; // ex.: nome da instituição que recebeu a doação
  data: string; // ISO date-time
}

/** Dados que o formulário de cadastro produz (o restante é gerado pelo app). */
export type NovoItemInput = Pick<
  ItemExcedente,
  'descricao' | 'categoria' | 'quantidade' | 'unidade' | 'validade' | 'fotoUri' | 'observacoes'
>;

export type NovaMovimentacaoInput = Pick<
  Movimentacao,
  'tipo' | 'quantidade' | 'responsavel' | 'destino'
>;

/** Filtro de validade disponível na lista. */
export type FiltroValidade = 'todos' | 'vencidos' | 'hoje' | 'ate3' | 'ate7';

/**
 * Estado genérico de uma requisição assíncrona.
 * Modelar como união discriminada obriga cada tela a tratar
 * carregamento, sucesso, vazio e erro explicitamente.
 */
export type EstadoRequisicao<T> =
  | { status: 'ocioso' }
  | { status: 'carregando' }
  | { status: 'sucesso'; dados: T }
  | { status: 'vazio' }
  | { status: 'erro'; mensagem: string };
