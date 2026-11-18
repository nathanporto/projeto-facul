import { buscarProdutos, ErroApi, sincronizar } from '../api';

/**
 * Testes da camada de API com fetch simulado (mock):
 * validam o processamento do JSON e o tratamento de erros sem depender da internet.
 */
const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

afterEach(() => fetchMock.mockReset());

function resposta(json: unknown, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(json) });
}

describe('buscarProdutos', () => {
  it('processa o JSON e descarta produtos sem nome', async () => {
    fetchMock.mockReturnValue(
      resposta({
        count: 2,
        products: [
          { code: '1', product_name: 'Arroz branco', brands: 'Marca A, Marca B', categories: 'Grãos,Cereais,Arroz' },
          { code: '2', product_name: '' },
        ],
      }),
    );
    const r = await buscarProdutos('arroz');
    expect(r).toEqual([
      { codigo: '1', nome: 'Arroz branco', marca: 'Marca A', categorias: 'Grãos, Cereais', imagem: undefined },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('search_terms=arroz');
  });

  it('converte erro HTTP em ErroApi com mensagem amigável', async () => {
    fetchMock.mockReturnValue(resposta({}, 503));
    await expect(buscarProdutos('arroz')).rejects.toThrow(/HTTP 503/);
  });

  it('converte falha de rede em ErroApi', async () => {
    fetchMock.mockReturnValue(Promise.reject(new TypeError('Network request failed')));
    await expect(buscarProdutos('arroz')).rejects.toBeInstanceOf(ErroApi);
  });
});

describe('sincronizar', () => {
  it('envia POST com JSON sem URIs locais de foto', async () => {
    fetchMock.mockReturnValue(resposta({ id: 101 }));
    const r = await sincronizar(
      [
        {
          id: 'a',
          descricao: 'Pão',
          categoria: 'padaria',
          quantidade: 1,
          quantidadeInicial: 1,
          unidade: 'un',
          validade: '2026-11-20',
          status: 'disponivel',
          criadoEm: '2026-11-17T10:00:00.000Z',
          fotoUri: 'file:///foto.jpg',
        },
      ],
      [],
    );
    expect(r.protocolo).toBe('101');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).not.toContain('foto.jpg');
  });
});
