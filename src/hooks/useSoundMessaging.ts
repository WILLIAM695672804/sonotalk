import { useCallback, useEffect, useRef, useState } from 'react';
import { createSoundEngine, SoundEngine } from '../audio/soundEngine';
import { Message, SoundMode, Speed, Status } from '../types';

// Séparateur (unit separator, U+001F) entre le pseudo et le texte dans la
// charge utile transmise. Porte le pseudo (F-09) et permet d'ignorer son
// propre écho capté par le micro.
const SEP = String.fromCharCode(31);

let counter = 0;
const newId = () => `${Date.now()}-${counter++}`;

export interface SoundMessaging {
  messages: Message[];
  status: Status;
  statusText: string;
  listening: boolean;
  progress: number;
  ready: boolean;
  send: (text: string) => Promise<void>;
  toggleListening: () => Promise<void>;
}

export function useSoundMessaging(
  nick: string,
  mode: SoundMode,
  speed: Speed,
): SoundMessaging {
  const engineRef = useRef<SoundEngine | null>(null);
  if (!engineRef.current) engineRef.current = createSoundEngine();
  const engine = engineRef.current;

  // Identifiant de session aléatoire (distinct du pseudo affiché) : sert
  // uniquement à reconnaître et ignorer sa propre émission, même si deux
  // appareils utilisent le même pseudo.
  const sessionId = useRef(Math.random().toString(36).slice(2, 6)).current;

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [statusText, setStatusText] = useState('Prêt');
  const [listening, setListening] = useState(false);
  const [progress, setProgress] = useState(0);
  const ready = engine.isSupported();

  // Refs pour que les callbacks longue durée (décodage micro) lisent toujours
  // les valeurs courantes sans être recréés.
  const nickRef = useRef(nick);
  const modeRef = useRef(mode);
  const speedRef = useRef(speed);
  const listeningRef = useRef(false);
  const revertTimer = useRef<any>(null);

  useEffect(() => { nickRef.current = nick; }, [nick]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const idleLabel = () => (listeningRef.current ? 'À l’écoute…' : 'Prêt');
  const idleStatus = (): Status => (listeningRef.current ? 'listening' : 'idle');

  const handleMessage = useCallback((raw: string) => {
    // Charge utile : sessionId · pseudo · texte (texte peut contenir des SEP).
    const parts = raw.split(SEP);
    const sid = parts[0] ?? '';
    const inNick = parts[1] ?? '';
    const text = parts.slice(2).join(SEP);

    // Notre propre émission captée par notre micro → on ignore.
    if (sid === sessionId) return;
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        text,
        sender: 'them',
        nick: inNick || undefined,
        via: 'sound',
        ts: Date.now(),
      },
    ]);

    setStatus('success');
    setStatusText('Message reçu');
    if (revertTimer.current) clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => {
      setStatus(idleStatus());
      setStatusText(idleLabel());
    }, 1400);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          text: trimmed,
          sender: 'me',
          nick: nickRef.current,
          via: 'sound',
          ts: Date.now(),
        },
      ]);

      setStatus('emitting');
      setStatusText('Émission en cours…');
      setProgress(0);

      try {
        const payload = `${sessionId}${SEP}${nickRef.current}${SEP}${trimmed}`;
        await engine.send(payload, modeRef.current, speedRef.current, setProgress);
        setStatus(idleStatus());
        setStatusText(idleLabel());
      } catch (err: any) {
        setStatus('error');
        setStatusText((err && err.message) || 'Échec de l’émission.');
      } finally {
        setProgress(0);
      }
    },
    [engine],
  );

  const toggleListening = useCallback(async () => {
    if (listeningRef.current) {
      engine.stopListening();
      listeningRef.current = false;
      setListening(false);
      setStatus('idle');
      setStatusText('Prêt');
      return;
    }
    try {
      await engine.startListening(handleMessage, (message) => {
        setStatus('error');
        setStatusText(message);
        listeningRef.current = false;
        setListening(false);
      });
      listeningRef.current = true;
      setListening(true);
      setStatus('listening');
      setStatusText('À l’écoute…');
    } catch {
      // L'erreur a déjà été remontée via onError.
    }
  }, [engine, handleMessage]);

  useEffect(() => {
    return () => {
      if (revertTimer.current) clearTimeout(revertTimer.current);
      engine.destroy();
    };
  }, [engine]);

  return { messages, status, statusText, listening, progress, ready, send, toggleListening };
}
