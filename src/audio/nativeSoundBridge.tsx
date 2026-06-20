// Pont audio natif (Android) : fait tourner le MÊME moteur ggwave que la version
// web, mais à l'intérieur d'une WebView cachée. L'interface React Native reste
// native ; seuls l'encodage/décodage et l'accès micro/haut-parleur passent par
// la WebView (qui dispose de la Web Audio API, absente côté React Native pur).
//
//   soundEngine.native.ts  →  nativeBridge (singleton)  →  <NativeSoundBridge/> (WebView)
//
// Le composant <NativeSoundBridge/> est monté une seule fois dans App.tsx.

import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { GGWAVE_BASE64 } from './ggwaveSource';
import { ErrorCb, MessageCb, ProgressCb } from './soundEngineTypes';
import { SoundMode, Speed } from '../types';

// Panneau de diagnostic à l'écran (logs de la WebView). À repasser à false une
// fois le son validé sur appareil.
const DEBUG = true;

// ---------------------------------------------------------------------------
// Singleton de pont
// ---------------------------------------------------------------------------

type Command =
  | { type: 'prepare' }
  | { type: 'send'; id: string; text: string; mode: SoundMode; speed: Speed }
  | { type: 'startListening' }
  | { type: 'stopListening' };

interface PendingSend {
  resolve: () => void;
  reject: (e: Error) => void;
  onProgress?: ProgressCb;
}

class NativeBridge {
  private post: ((cmd: Command) => void) | null = null;
  private queue: Command[] = [];

  private prepareWaiters: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];
  private prepared = false;

  private sends = new Map<string, PendingSend>();
  private listenAck: { resolve: () => void; reject: (e: Error) => void } | null = null;
  private onMessage: MessageCb | null = null;
  private onError: ErrorCb | null = null;

  // Diagnostic
  logs: string[] = [];
  private logSub: ((logs: string[]) => void) | null = null;

  private pushLog(line: string) {
    const stamp = new Date().toISOString().slice(11, 19);
    this.logs = [...this.logs.slice(-40), `${stamp} ${line}`];
    if (this.logSub) this.logSub(this.logs);
  }
  subscribeLogs(cb: (logs: string[]) => void) {
    this.logSub = cb;
    cb(this.logs);
    return () => {
      if (this.logSub === cb) this.logSub = null;
    };
  }

  register(post: (cmd: Command) => void) {
    this.post = post;
    this.pushLog('[RN] WebView prête, ' + this.queue.length + ' cmd en file');
    const pending = this.queue;
    this.queue = [];
    pending.forEach((c) => post(c));
  }

  unregister() {
    this.post = null;
    this.prepared = false;
  }

  private send(cmd: Command) {
    this.pushLog('[RN→WV] ' + cmd.type);
    if (this.post) this.post(cmd);
    else this.queue.push(cmd);
  }

  prepare(): Promise<void> {
    if (this.prepared) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      this.prepareWaiters.push({ resolve, reject });
      this.send({ type: 'prepare' });
    });
  }

  sendMessage(id: string, text: string, mode: SoundMode, speed: Speed, onProgress?: ProgressCb): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.sends.set(id, { resolve, reject, onProgress });
      this.send({ type: 'send', id, text, mode, speed });
    });
  }

  startListening(onMessage: MessageCb, onError?: ErrorCb): Promise<void> {
    this.onMessage = onMessage;
    this.onError = onError || null;
    return new Promise<void>((resolve, reject) => {
      this.listenAck = { resolve, reject };
      this.send({ type: 'startListening' });
    });
  }

  stopListening() {
    this.onMessage = null;
    this.send({ type: 'stopListening' });
  }

  handleWebMessage(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === 'log') {
      this.pushLog('[WV] ' + msg.text);
      return;
    }
    switch (msg.type) {
      case 'ready':
        this.prepared = true;
        this.prepareWaiters.forEach((w) => w.resolve());
        this.prepareWaiters = [];
        break;
      case 'prepareError': {
        const err = new Error(msg.message || 'Initialisation audio impossible.');
        this.prepareWaiters.forEach((w) => w.reject(err));
        this.prepareWaiters = [];
        break;
      }
      case 'progress': {
        const s = this.sends.get(msg.id);
        if (s && s.onProgress) s.onProgress(msg.ratio);
        break;
      }
      case 'sent': {
        const s = this.sends.get(msg.id);
        if (s) {
          s.resolve();
          this.sends.delete(msg.id);
        }
        break;
      }
      case 'sendError': {
        const s = this.sends.get(msg.id);
        if (s) {
          s.reject(new Error(msg.message || 'Échec de l’émission.'));
          this.sends.delete(msg.id);
        }
        break;
      }
      case 'listening':
        if (this.listenAck) {
          this.listenAck.resolve();
          this.listenAck = null;
        }
        break;
      case 'message':
        if (this.onMessage && typeof msg.text === 'string') this.onMessage(msg.text);
        break;
      case 'listenError': {
        const message = msg.message || 'Micro indisponible.';
        if (this.listenAck) {
          this.listenAck.reject(new Error(message));
          this.listenAck = null;
        }
        if (this.onError) this.onError(message);
        break;
      }
    }
  }
}

export const nativeBridge = new NativeBridge();

// ---------------------------------------------------------------------------
// Code exécuté DANS la WebView (logique encode/décode reprise de soundEngine.ts).
// console.* et erreurs sont renvoyés à RN via {type:'log'} pour le diagnostic.
// ---------------------------------------------------------------------------

const IN_WEBVIEW_JS = `
(function () {
  var RN = window.ReactNativeWebView;
  function reply(obj) { try { RN && RN.postMessage(JSON.stringify(obj)); } catch (e) {} }
  function log(s) { reply({ type: 'log', text: String(s) }); }

  window.onerror = function (m, src, l, c) { log('window.onerror: ' + m + ' @' + l + ':' + c); };
  ['log','warn','error'].forEach(function (k) {
    var orig = console[k];
    console[k] = function () { try { log(k + ': ' + Array.prototype.join.call(arguments, ' ')); } catch (e) {} orig && orig.apply(console, arguments); };
  });

  log('boot secure=' + window.isSecureContext + ' md=' + !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) + ' url=' + location.href);

  try {
    var src = atob(window.__GGWAVE_B64__);
    (0, eval)(src);
    log('ggwave eval ok, factory=' + (typeof window.ggwave_factory));
  } catch (e) {
    log('ggwave eval FAIL: ' + (e && e.message));
    reply({ type: 'prepareError', message: 'ggwave illisible: ' + (e && e.message) });
  }

  var ggwave = null, instance = null, ctx = null;
  var mediaStream = null, sourceNode = null, processor = null, workletNode = null, workletReady = false;

  var WORKLET_SRC =
    'class C extends AudioWorkletProcessor{constructor(){super();this._b=new Float32Array(1024);this._n=0;}' +
    'process(i){var c=i[0]&&i[0][0];if(c){for(var k=0;k<c.length;k++){this._b[this._n++]=c[k];' +
    'if(this._n===this._b.length){this.port.postMessage(this._b.slice(0));this._n=0;}}}return true;}}' +
    'registerProcessor("ggwave-capture",C);';

  function reinterpret(s, T) { var b = new ArrayBuffer(s.byteLength); new s.constructor(b).set(s); return new T(b); }

  function ensureReady() {
    return new Promise(function (resolve, reject) {
      try {
        if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); log('AudioContext sr=' + ctx.sampleRate + ' state=' + ctx.state); }
        var resumed = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
        resumed.then(function () {
          log('ctx.state=' + ctx.state);
          function fin() {
            if (!instance) {
              var p = ggwave.getDefaultParameters();
              p.sampleRateInp = ctx.sampleRate; p.sampleRateOut = ctx.sampleRate;
              instance = ggwave.init(p);
              log('ggwave instance ok');
            }
            resolve();
          }
          if (ggwave) return fin();
          var f = window.ggwave_factory;
          if (!f) return reject(new Error('ggwave_factory absent'));
          f().then(function (g) { ggwave = g; log('factory resolved'); fin(); }).catch(function (e) { log('factory FAIL ' + (e && e.message)); reject(e); });
        }).catch(function (e) { log('resume FAIL ' + (e && e.message)); reject(e); });
      } catch (e) { log('ensureReady throw ' + (e && e.message)); reject(e); }
    });
  }

  function protocolFor(mode, speed) {
    var P = ggwave.ProtocolId;
    if (mode === 'ultrasound')
      return speed === 'fast' ? P.GGWAVE_PROTOCOL_ULTRASOUND_FAST : P.GGWAVE_PROTOCOL_ULTRASOUND_NORMAL;
    return speed === 'fast' ? P.GGWAVE_PROTOCOL_AUDIBLE_FAST : P.GGWAVE_PROTOCOL_AUDIBLE_NORMAL;
  }

  function doSend(cmd) {
    log('doSend "' + cmd.text + '" ' + cmd.mode + '/' + cmd.speed);
    ensureReady().then(function () {
      var protocol = protocolFor(cmd.mode, cmd.speed);
      var encoded = ggwave.encode(instance, cmd.text, protocol, 10);
      var samples = reinterpret(encoded, Float32Array);
      log('encoded samples=' + samples.length);
      var buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buf.getChannelData(0).set(samples);
      var node = ctx.createBufferSource();
      node.buffer = buf; node.connect(ctx.destination);
      var durationMs = (samples.length / ctx.sampleRate) * 1000;
      var start = performance.now(), raf = 0;
      function tick() {
        var ratio = Math.min(1, (performance.now() - start) / durationMs);
        reply({ type: 'progress', id: cmd.id, ratio: ratio });
        if (ratio < 1) raf = requestAnimationFrame(tick);
      }
      node.onended = function () { cancelAnimationFrame(raf); log('send ended'); reply({ type: 'progress', id: cmd.id, ratio: 1 }); reply({ type: 'sent', id: cmd.id }); };
      node.start(); tick();
      log('node.start (duree ' + Math.round(durationMs) + 'ms)');
    }).catch(function (e) { log('doSend FAIL ' + (e && e.message)); reply({ type: 'sendError', id: cmd.id, message: (e && e.message) || 'Echec emission' }); });
  }

  function decodeChunk(samples) {
    try {
      var decoded = ggwave.decode(instance, reinterpret(new Float32Array(samples), Int8Array));
      if (decoded && decoded.length > 0) {
        var text = new TextDecoder('utf-8').decode(decoded);
        if (text) { log('decoded "' + text + '"'); reply({ type: 'message', text: text }); }
      }
    } catch (e) { /* bruit non décodable : ignoré */ }
  }

  function doStartListening() {
    log('doStartListening');
    ensureReady().then(function () {
      return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } });
    }).then(function (stream) {
      log('getUserMedia ok');
      mediaStream = stream;
      sourceNode = ctx.createMediaStreamSource(stream);
      function finish() { log('listening (worklet=' + workletReady + ')'); reply({ type: 'listening' }); }
      if (ctx.audioWorklet && window.AudioWorkletNode) {
        var go = workletReady ? Promise.resolve() : ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' })));
        go.then(function () {
          workletReady = true;
          workletNode = new AudioWorkletNode(ctx, 'ggwave-capture');
          workletNode.port.onmessage = function (e) { decodeChunk(e.data); };
          sourceNode.connect(workletNode); workletNode.connect(ctx.destination);
          finish();
        }).catch(function (e) {
          log('worklet FAIL, fallback ScriptProcessor: ' + (e && e.message));
          processor = ctx.createScriptProcessor(1024, 1, 1);
          processor.onaudioprocess = function (e) { decodeChunk(e.inputBuffer.getChannelData(0)); };
          sourceNode.connect(processor); processor.connect(ctx.destination);
          finish();
        });
      } else {
        processor = ctx.createScriptProcessor(1024, 1, 1);
        processor.onaudioprocess = function (e) { decodeChunk(e.inputBuffer.getChannelData(0)); };
        sourceNode.connect(processor); processor.connect(ctx.destination);
        finish();
      }
    }).catch(function (e) {
      var m = (e && e.name === 'NotAllowedError') ? 'Acces au micro refuse.' : ((e && e.message) || 'Micro indisponible.');
      log('getUserMedia FAIL ' + (e && e.name) + ' ' + (e && e.message));
      reply({ type: 'listenError', message: m });
    });
  }

  function doStopListening() {
    log('doStopListening');
    if (processor) { processor.disconnect(); processor.onaudioprocess = null; processor = null; }
    if (workletNode) { try { workletNode.port.onmessage = null; } catch (e) {} workletNode.disconnect(); workletNode = null; }
    if (sourceNode) { sourceNode.disconnect(); sourceNode = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(function (t) { t.stop(); }); mediaStream = null; }
  }

  function handle(cmd) {
    log('cmd recv: ' + cmd.type);
    if (cmd.type === 'prepare') ensureReady().then(function () { reply({ type: 'ready' }); }).catch(function (e) { reply({ type: 'prepareError', message: (e && e.message) || 'init' }); });
    else if (cmd.type === 'send') doSend(cmd);
    else if (cmd.type === 'startListening') doStartListening();
    else if (cmd.type === 'stopListening') doStopListening();
  }

  function onMsg(ev) {
    var data = ev.data;
    if (typeof data !== 'string') return;
    var cmd; try { cmd = JSON.parse(data); } catch (e) { return; }
    handle(cmd);
  }
  window.addEventListener('message', onMsg);
  document.addEventListener('message', onMsg);

  reply({ type: 'booted' });
  true;
})();
`;

const HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body><script>window.__GGWAVE_B64__ = "${GGWAVE_BASE64}";</script></body></html>`;

export function NativeSoundBridge() {
  const ref = useRef<WebView>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    nativeBridge.register((cmd) => {
      ref.current?.postMessage(JSON.stringify(cmd));
    });
    return () => nativeBridge.unregister();
  }, []);

  useEffect(() => (DEBUG ? nativeBridge.subscribeLogs(setLogs) : undefined), []);

  return (
    <>
      <View style={styles.hidden} pointerEvents="none">
        <WebView
          ref={ref}
          source={{ html: HTML, baseUrl: 'https://localhost/' }}
          originWhitelist={['*']}
          injectedJavaScript={IN_WEBVIEW_JS}
          onMessage={(e) => nativeBridge.handleWebMessage(e.nativeEvent.data)}
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
      {DEBUG ? (
        <View style={styles.debug} pointerEvents="none">
          <ScrollView>
            {logs.map((l, i) => (
              <Text key={i} style={styles.debugLine}>{l}</Text>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  debug: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 90,
    maxHeight: 220,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 8,
    padding: 6,
  },
  debugLine: { color: '#7CFC00', fontSize: 9, fontFamily: 'monospace', lineHeight: 12 },
});
