// Interface commune aux deux implémentations du moteur sonore :
//   - soundEngine.ts        → web (ggwave + Web Audio dans le navigateur)
//   - soundEngine.native.ts → Android (ggwave dans une WebView cachée, voir
//                             nativeSoundBridge.tsx)
// Metro résout l'extension `.native.ts` sur appareil et `.ts` sur le web ;
// les deux exportent `createSoundEngine` et ce contrat identique.

import { SoundMode, Speed } from '../types';

export type ProgressCb = (ratio: number) => void;
export type MessageCb = (text: string) => void;
export type ErrorCb = (message: string) => void;

export interface SoundEngine {
  isSupported(): boolean;
  prepare(): Promise<void>;
  send(text: string, mode: SoundMode, speed: Speed, onProgress?: ProgressCb): Promise<void>;
  startListening(onMessage: MessageCb, onError?: ErrorCb): Promise<void>;
  stopListening(): void;
  destroy(): void;
}
