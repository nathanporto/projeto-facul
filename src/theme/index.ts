import { Platform, type ViewStyle } from 'react-native';

/** Paleta e espaçamentos únicos para todo o app. */
export const cores = {
  primaria: '#2E7D32',
  primariaClara: '#E8F5E9',
  fundo: '#F6F7F4',
  superficie: '#FFFFFF',
  texto: '#1B1F1C',
  textoSuave: '#5F6B63',
  borda: '#DDE3DD',
  perigo: '#C62828',
  perigoClaro: '#FDECEA',
  alerta: '#EF6C00',
  alertaClaro: '#FFF3E0',
  info: '#1565C0',
};

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const raio = { sm: 8, md: 12, lg: 16, pill: 999 };

/**
 * Sombra multiplataforma: Android usa `elevation`, iOS usa as props `shadow*`.
 * Platform.select escolhe a implementação correta em tempo de execução,
 * mantendo um único estilo compartilhado nos componentes.
 */
export const sombra: ViewStyle =
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 3 },
    default: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  }) ?? {};
