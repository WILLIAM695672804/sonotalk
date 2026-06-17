// Charte visuelle « B » (mode clair) — validée pour SonoTalk.
// Sémantique : indigo = ce qui part (envoi/émission), teal = le son
// (écoute/réception/ultrason), vert = succès, rouge = échec.

export const colors = {
  bg: '#FFFFFF',
  surface: '#F6F7F9',
  border: '#E6E8EC',

  textPrimary: '#1A1D21',
  textSecondary: '#9AA0A8',
  textOnAccent: '#FFFFFF',

  bubbleReceived: '#EDEFF2',
  bubbleSent: '#5B6CF0',

  inputBg: '#F0F1F4',
  avatarBg: '#E7E9EF',
  avatarText: '#5B6470',

  accent: '#5B6CF0', // indigo — envoi / émission
  accentSoft: '#F0F2FE',
  accentText: '#3C3489',

  sound: '#0F9E8A', // teal — le son
  soundBg: '#E6F7F3',
  soundText: '#0F766E',
  soundBorder: '#D2EDE6',

  success: '#3B6D11',
  successBg: '#EAF6E0',
  successBorder: '#D7EBC2',

  danger: '#A32D2D',
  dangerSoft: '#B06A6A',
  dangerBg: '#FCEBEB',
  dangerBorder: '#F3C9C9',

  warnBg: '#FBF1DE',
  warnText: '#854F0B',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

// Débit faible (~8–16 o/s) → on borne les messages pour rester fiable et rapide.
export const MAX_CHARS = 64;
