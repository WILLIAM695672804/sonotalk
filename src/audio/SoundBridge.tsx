// Point de montage du pont audio. Sur appareil (Android), rend la WebView
// cachée qui héberge ggwave. Sur le web, voir SoundBridge.web.tsx (rend null —
// le navigateur exécute déjà ggwave directement, sans WebView ni dépendance
// react-native-webview).
export { NativeSoundBridge as SoundBridge } from './nativeSoundBridge';
