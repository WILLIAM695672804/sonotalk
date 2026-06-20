// Implémentation native (Android) du moteur sonore. Metro choisit ce fichier
// (`.native.ts`) sur appareil, et `soundEngine.ts` sur le web — tous deux
// exposent `createSoundEngine` et le contrat `SoundEngine`.
//
// Ici, tout le travail audio est délégué à une WebView cachée via `nativeBridge`
// (voir nativeSoundBridge.tsx). Le composant <NativeSoundBridge/> doit être
// monté dans l'arbre React (fait dans App.tsx).

import { SoundEngine } from './soundEngineTypes';
import { nativeBridge } from './nativeSoundBridge';

export type { SoundEngine } from './soundEngineTypes';

let counter = 0;
const newId = () => `s${Date.now()}-${counter++}`;

export function createSoundEngine(): SoundEngine {
  return {
    // La transmission est assurée par la WebView : supportée sur appareil.
    isSupported: () => true,

    prepare: () => nativeBridge.prepare(),

    send: (text, mode, speed, onProgress) =>
      nativeBridge.sendMessage(newId(), text, mode, speed, onProgress),

    startListening: (onMessage, onError) =>
      nativeBridge.startListening(onMessage, onError),

    stopListening: () => nativeBridge.stopListening(),

    destroy: () => nativeBridge.stopListening(),
  };
}
