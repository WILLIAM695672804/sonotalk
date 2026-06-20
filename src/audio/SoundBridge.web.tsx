// Variante web : aucun pont nécessaire (soundEngine.ts utilise ggwave + Web
// Audio directement dans le navigateur). On évite ainsi d'embarquer
// react-native-webview dans le bundle web.
export function SoundBridge() {
  return null;
}
