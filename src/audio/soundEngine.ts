// Moteur de transmission sonore.
//
// Web (environnement de dev/démo principal) : ggwave compilé en WebAssembly,
// chargé depuis un CDN au moment de l'exécution, branché sur la Web Audio API.
// On évite ainsi tout souci de bundling WASM avec Metro.
//
// Natif (Android dev build) : nécessite un module natif ggwave, non encore
// intégré → stub explicite. La démo web reste pleinement fonctionnelle.

import { Platform } from 'react-native';
import { SoundMode, Speed } from '../types';

type ProgressCb = (ratio: number) => void;
type MessageCb = (text: string) => void;
type ErrorCb = (message: string) => void;

export interface SoundEngine {
  isSupported(): boolean;
  prepare(): Promise<void>;
  send(text: string, mode: SoundMode, speed: Speed, onProgress?: ProgressCb): Promise<void>;
  startListening(onMessage: MessageCb, onError?: ErrorCb): Promise<void>;
  stopListening(): void;
  destroy(): void;
}

// Accès aux globals navigateur sans dépendre de la lib DOM côté TypeScript.
const G: any = typeof globalThis !== 'undefined' ? globalThis : {};

// ggwave 0.4.0, build « single-file » (le WebAssembly est embarqué en base64
// dans le .js). Hébergé localement (public/vendor/ggwave.js) → fonctionne
// hors-ligne (NF-04). Le CDN n'est qu'un repli de secours.
const GGWAVE_SOURCES = [
  '/vendor/ggwave.js',
  'https://unpkg.com/ggwave/ggwave.js',
  'https://cdn.jsdelivr.net/npm/ggwave/ggwave.js',
];

// ggwave échange des tableaux typés réinterprétés octet pour octet
// (Float32 <-> Int8) ; on copie le buffer sans le reconvertir.
function reinterpret(src: any, TypedArray: any) {
  const buffer = new ArrayBuffer(src.byteLength);
  new src.constructor(buffer).set(src);
  return new TypedArray(buffer);
}

// Processeur AudioWorklet de capture micro : exécuté dans le thread audio, il
// accumule les échantillons par blocs de 1024 et les renvoie au thread principal
// (où vit l'instance ggwave) pour décodage. Fiable sur Safari iOS, contrairement
// à ScriptProcessorNode. Injecté via un Blob pour éviter un fichier servi à part.
const WORKLET_SRC = `
class GgwaveCapture extends AudioWorkletProcessor {
  constructor() { super(); this._buf = new Float32Array(1024); this._n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this._buf[this._n++] = ch[i];
        if (this._n === this._buf.length) {
          this.port.postMessage(this._buf.slice(0));
          this._n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('ggwave-capture', GgwaveCapture);
`;

function createWebEngine(): SoundEngine {
  let ggwave: any = null;
  let instance: any = null;
  let ctx: any = null;
  let loadPromise: Promise<any> | null = null;

  let mediaStream: any = null;
  let sourceNode: any = null;
  let processor: any = null;
  let workletNode: any = null;
  let workletReady = false;

  function loadGgwave(): Promise<any> {
    if (loadPromise) return loadPromise;
    loadPromise = new Promise((resolve, reject) => {
      if (G.ggwave_factory) {
        G.ggwave_factory().then(resolve).catch(reject);
        return;
      }
      let i = 0;
      const tryNext = () => {
        if (i >= GGWAVE_SOURCES.length) {
          reject(new Error('Impossible de charger le moteur ggwave.'));
          return;
        }
        const script = G.document.createElement('script');
        script.src = GGWAVE_SOURCES[i++];
        script.async = true;
        script.onload = () => {
          if (G.ggwave_factory) G.ggwave_factory().then(resolve).catch(reject);
          else tryNext();
        };
        script.onerror = tryNext;
        G.document.head.appendChild(script);
      };
      tryNext();
    });
    return loadPromise;
  }

  async function ensureReady(): Promise<void> {
    if (!ctx) {
      const AC = G.AudioContext || G.webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') await ctx.resume();
    if (!ggwave) ggwave = await loadGgwave();
    if (!instance) {
      const params = ggwave.getDefaultParameters();
      params.sampleRateInp = ctx.sampleRate;
      params.sampleRateOut = ctx.sampleRate;
      instance = ggwave.init(params);
    }
  }

  function protocolFor(mode: SoundMode, speed: Speed): number {
    const P = ggwave.ProtocolId;
    if (mode === 'ultrasound') {
      return speed === 'fast'
        ? P.GGWAVE_PROTOCOL_ULTRASOUND_FAST
        : P.GGWAVE_PROTOCOL_ULTRASOUND_NORMAL;
    }
    return speed === 'fast'
      ? P.GGWAVE_PROTOCOL_AUDIBLE_FAST
      : P.GGWAVE_PROTOCOL_AUDIBLE_NORMAL;
  }

  return {
    isSupported() {
      return !!(G.AudioContext || G.webkitAudioContext) &&
        !!(G.navigator && G.navigator.mediaDevices && G.navigator.mediaDevices.getUserMedia);
    },

    async prepare() {
      await ensureReady();
    },

    async send(text, mode, speed, onProgress) {
      await ensureReady();
      const protocol = protocolFor(mode, speed);
      const encoded = ggwave.encode(instance, text, protocol, 10); // volume 10
      const samples = reinterpret(encoded, Float32Array);

      const audioBuffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      audioBuffer.getChannelData(0).set(samples);

      const node = ctx.createBufferSource();
      node.buffer = audioBuffer;
      node.connect(ctx.destination);

      const durationMs = (samples.length / ctx.sampleRate) * 1000;
      await new Promise<void>((resolve) => {
        const start = G.performance.now();
        let raf = 0;
        const tick = () => {
          const ratio = Math.min(1, (G.performance.now() - start) / durationMs);
          onProgress && onProgress(ratio);
          if (ratio < 1) raf = G.requestAnimationFrame(tick);
        };
        node.onended = () => {
          G.cancelAnimationFrame(raf);
          onProgress && onProgress(1);
          resolve();
        };
        node.start();
        tick();
      });
    },

    async startListening(onMessage, onError) {
      try {
        await ensureReady();
        mediaStream = await G.navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
          },
        });
        sourceNode = ctx.createMediaStreamSource(mediaStream);

        const decodeChunk = (samples: any) => {
          try {
            const decoded = ggwave.decode(
              instance,
              reinterpret(new Float32Array(samples), Int8Array),
            );
            if (decoded && decoded.length > 0) {
              const text = new G.TextDecoder('utf-8').decode(decoded);
              if (text) onMessage(text);
            }
          } catch {
            // Bruit non décodable : on ignore silencieusement.
          }
        };

        // AudioWorklet d'abord (fiable partout, dont Safari iOS) ; repli sur
        // ScriptProcessorNode pour les navigateurs anciens sans worklet.
        let usingWorklet = false;
        if (ctx.audioWorklet && G.AudioWorkletNode) {
          try {
            if (!workletReady) {
              const blob = new G.Blob([WORKLET_SRC], { type: 'application/javascript' });
              await ctx.audioWorklet.addModule(G.URL.createObjectURL(blob));
              workletReady = true;
            }
            workletNode = new G.AudioWorkletNode(ctx, 'ggwave-capture');
            workletNode.port.onmessage = (e: any) => decodeChunk(e.data);
            sourceNode.connect(workletNode);
            workletNode.connect(ctx.destination);
            usingWorklet = true;
          } catch {
            usingWorklet = false;
          }
        }

        if (!usingWorklet) {
          processor = ctx.createScriptProcessor(1024, 1, 1);
          processor.onaudioprocess = (e: any) =>
            decodeChunk(e.inputBuffer.getChannelData(0));
          sourceNode.connect(processor);
          processor.connect(ctx.destination);
        }
      } catch (err: any) {
        const message =
          err && err.name === 'NotAllowedError'
            ? 'Accès au micro refusé.'
            : (err && err.message) || 'Micro indisponible.';
        onError && onError(message);
        throw err;
      }
    },

    stopListening() {
      if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
        processor = null;
      }
      if (workletNode) {
        try {
          workletNode.port.onmessage = null;
        } catch {}
        workletNode.disconnect();
        workletNode = null;
      }
      if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t: any) => t.stop());
        mediaStream = null;
      }
    },

    destroy() {
      this.stopListening();
      if (ctx) {
        ctx.close();
        ctx = null;
      }
      instance = null;
      ggwave = null;
      loadPromise = null;
    },
  };
}

function createStubEngine(): SoundEngine {
  const message =
    'Transmission sonore indisponible sur cette plateforme. ' +
    'Utilisez la version web (navigateur) pour la démo.';
  return {
    isSupported: () => false,
    prepare: async () => {},
    send: async () => {
      throw new Error(message);
    },
    startListening: async (_onMessage, onError) => {
      onError && onError(message);
    },
    stopListening: () => {},
    destroy: () => {},
  };
}

export function createSoundEngine(): SoundEngine {
  return Platform.OS === 'web' ? createWebEngine() : createStubEngine();
}
