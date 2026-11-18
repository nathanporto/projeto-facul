import { brParaIso, descreverValidade, diasParaVencer, isoParaBr, mascaraData, passaFiltroValidade } from '../datas';

// "Agora" fixo: testes determinísticos, independentes do dia em que rodam.
const AGORA = new Date(2026, 10, 17, 14, 0); // 17/11/2026 14:00

describe('conversão de datas', () => {
  it('converte DD/MM/AAAA para ISO e volta', () => {
    expect(brParaIso('05/12/2026')).toBe('2026-12-05');
    expect(isoParaBr('2026-12-05')).toBe('05/12/2026');
  });

  it('rejeita datas inexistentes ou mal formatadas', () => {
    expect(brParaIso('31/02/2026')).toBeNull();
    expect(brParaIso('2026-12-05')).toBeNull();
    expect(brParaIso('1/1/2026')).toBeNull();
  });

  it('aplica máscara enquanto digita', () => {
    expect(mascaraData('1')).toBe('1');
    expect(mascaraData('171')).toBe('17/1');
    expect(mascaraData('17112026')).toBe('17/11/2026');
    expect(mascaraData('17/11/2026999')).toBe('17/11/2026');
  });
});

describe('cálculo de validade', () => {
  it('conta dias restantes ignorando o horário', () => {
    expect(diasParaVencer('2026-11-17', AGORA)).toBe(0);
    expect(diasParaVencer('2026-11-20', AGORA)).toBe(3);
    expect(diasParaVencer('2026-11-15', AGORA)).toBe(-2);
  });

  it('descreve a validade em texto amigável', () => {
    expect(descreverValidade('2026-11-17', AGORA)).toBe('Vence hoje');
    expect(descreverValidade('2026-11-18', AGORA)).toBe('Vence amanhã');
    expect(descreverValidade('2026-11-16', AGORA)).toBe('Vencido há 1 dia');
  });

  it('aplica os filtros de validade', () => {
    expect(passaFiltroValidade('2026-11-15', 'vencidos', AGORA)).toBe(true);
    expect(passaFiltroValidade('2026-11-17', 'hoje', AGORA)).toBe(true);
    expect(passaFiltroValidade('2026-11-20', 'ate3', AGORA)).toBe(true);
    expect(passaFiltroValidade('2026-11-21', 'ate3', AGORA)).toBe(false);
    expect(passaFiltroValidade('2026-11-24', 'ate7', AGORA)).toBe(true);
    expect(passaFiltroValidade('2026-11-15', 'ate7', AGORA)).toBe(false);
  });
});
