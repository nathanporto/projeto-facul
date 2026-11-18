/** Gera um id curto e único o suficiente para registros locais. */
export function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
