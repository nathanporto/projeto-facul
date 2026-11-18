import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

/**
 * Câmera e galeria (expo-image-picker) + cópia para armazenamento permanente
 * (expo-file-system). O picker devolve um arquivo em CACHE, que o sistema pode apagar;
 * por isso copiamos a foto para a pasta de documentos do app antes de salvar a URI.
 */

export type OrigemFoto = 'camera' | 'galeria';

function avisarPermissaoNegada(recurso: string, podePerguntar: boolean) {
  Alert.alert(
    `Sem acesso à ${recurso}`,
    podePerguntar
      ? `A ${recurso} é usada apenas para fotografar o item excedente. Você pode tentar novamente quando quiser.`
      : `O acesso à ${recurso} foi negado. Para adicionar fotos, libere a permissão nas configurações do aparelho.`,
    podePerguntar
      ? [{ text: 'OK' }]
      : [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
        ],
  );
}

async function pedirPermissao(origem: OrigemFoto): Promise<boolean> {
  const resp =
    origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!resp.granted) avisarPermissaoNegada(origem === 'camera' ? 'câmera' : 'galeria', resp.canAskAgain);
  return resp.granted;
}

/** Copia a imagem para Documentos/fotos e devolve a URI permanente. */
function persistirFoto(uriTemporaria: string): string {
  if (Platform.OS === 'web') return uriTemporaria; // na web a URI já é um blob/data URL
  const pasta = new Directory(Paths.document, 'fotos');
  pasta.create({ idempotent: true, intermediates: true });
  const origem = new File(uriTemporaria);
  const extensao = origem.extension || '.jpg';
  const destino = new File(pasta, `item-${Date.now()}${extensao}`);
  origem.copySync(destino);
  return destino.uri;
}

/** Abre câmera ou galeria e retorna a URI permanente da foto (ou null se cancelado). */
export async function escolherFoto(origem: OrigemFoto): Promise<string | null> {
  if (!(await pedirPermissao(origem))) return null;

  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.6, // fotos menores = menos espaço ocupado no aparelho
  };
  const resultado =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);

  if (resultado.canceled || !resultado.assets?.length) return null;
  try {
    return persistirFoto(resultado.assets[0].uri);
  } catch {
    // Se a cópia falhar, ainda usamos a URI original para não perder a foto da sessão.
    return resultado.assets[0].uri;
  }
}

/** Remove a foto do disco quando o item é excluído. */
export function apagarFoto(uri?: string): void {
  if (!uri || Platform.OS === 'web' || !uri.startsWith(Paths.document.uri)) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Ignora: arquivo já removido.
  }
}
