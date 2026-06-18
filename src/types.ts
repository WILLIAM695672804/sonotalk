export type SoundMode = 'audible' | 'ultrasound';
export type Speed = 'normal' | 'fast';

// Les quatre états visibles « d'un coup d'œil » (exigence NF-02).
export type Status = 'idle' | 'listening' | 'emitting' | 'success' | 'error';

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  nick?: string;
  via: 'sound' | 'local';
  ts: number;
  // 'error' : signal capté mais illisible (F-13 / CA-06). Affiché comme une
  // carte d'erreur, jamais comme du texte brut.
  kind?: 'text' | 'error';
}
