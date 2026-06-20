// Implémentation native (Android) du moteur sonore. Metro choisit ce fichier
// (`.native.ts`) sur appareil, et `soundEngine.ts` sur le web — tous deux
// exposent `createSoundEngine` et le contrat `SoundEngine`.
//
// Ici, tout le travail audio est délégué à une WebView cachée via `nativeBridge`
// (voir nativeSoundBridge.tsx). Le composant <NativeSoundBridge/> doit être
// monté dans l'arbre React (fait dans App.tsx).

import { PermissionsAndroid, Platform } from 'react-native';
import { SoundEngine } from './soundEngineTypes';
import { nativeBridge } from './nativeSoundBridge';

export type { SoundEngine } from './soundEngineTypes';

let counter = 0;
const newId = () => `s${Date.now()}-${counter++}`;

// Android 6+ exige une demande de permission micro à l'exécution. Sans elle, la
// WebView ne peut pas obtenir getUserMedia, même avec mediaCapturePermissionGrantType.
async function ensureMicPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Accès au micro',
      message: 'SonoTalk a besoin du micro pour écouter les messages sonores.',
      buttonPositive: 'Autoriser',
      buttonNegative: 'Refuser',
    },
  );
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Accès au micro refusé.');
  }
}

export function createSoundEngine(): SoundEngine {
  return {
    // La transmission est assurée par la WebView : supportée sur appareil.
    isSupported: () => true,

    prepare: () => nativeBridge.prepare(),

    send: (text, mode, speed, onProgress) =>
      nativeBridge.sendMessage(newId(), text, mode, speed, onProgress),

    startListening: async (onMessage, onError) => {
      try {
        await ensureMicPermission();
      } catch (e: any) {
        const message = (e && e.message) || 'Accès au micro refusé.';
        if (onError) onError(message);
        throw e;
      }
      return nativeBridge.startListening(onMessage, onError);
    },

    stopListening: () => nativeBridge.stopListening(),

    destroy: () => nativeBridge.stopListening(),
  };
}
