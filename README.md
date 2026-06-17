# SonoTalk

Messagerie par **ondes sonores** : transmission de messages texte d'un appareil à
un autre par le son (haut-parleur → micro), sans réseau (ni Wi-Fi, ni Bluetooth,
ni données mobiles). MVP de projet tutoré.

Encodage/décodage assurés par [ggwave](https://github.com/ggerganov/ggwave)
(correction d'erreurs intégrée, multi-protocoles), modes **audible** et **ultrason**.

## Lancer la démo

Environnement principal : navigateur PC via Expo Web.

```bash
npm run web      # ouvre l'app dans le navigateur (http://localhost:8081)
```

Pour la démo de transmission, ouvrir **deux fenêtres/onglets** (ou deux appareils) :
l'un émet, l'autre touche « Écouter » pour décoder. Garder un mode identique des
deux côtés. Autoriser l'accès au micro lorsqu'il est demandé.

> Le décodage micro temps réel n'existe pas dans Expo Go : utiliser Expo Web (ici)
> ou, plus tard, un Expo Dev Build Android (module natif ggwave à intégrer).

## Architecture

```
App.tsx                      racine : état global (pseudo, mode, vitesse) + navigation
src/
  theme.ts                   tokens couleur (charte claire validée)
  types.ts                   Message, SoundMode, Speed, Status
  audio/soundEngine.ts       moteur ggwave + Web Audio (web) · stub natif
  hooks/useSoundMessaging.ts  émission, écoute, gestion des 4 états, anti-écho
  components/
    Waveform.tsx             forme d'onde animée (élément héros)
    MessageBubble.tsx        bulle envoyée / reçue
    StatusStrip.tsx          bandeau d'état + bouton micro
    ModeToggle.tsx           bascule audible / ultrason (réversible à chaud)
    Composer.tsx             saisie + compteur de caractères
  screens/
    ConversationScreen.tsx   fil de discussion + émission/écoute
    SettingsScreen.tsx       mode, vitesse, pseudo
```

### Format de la charge utile transmise

`sessionId · pseudo · texte` (séparateur U+001F). Le `sessionId` (aléatoire par
session) permet d'ignorer sa propre émission captée par le micro ; le pseudo (F-09)
s'affiche sous les messages reçus.

## Plateformes

- **Web** (navigateur) : pleinement fonctionnel (ggwave WASM + Web Audio API).
- **Android** (dev build) : interface fonctionnelle ; transmission sonore à brancher
  sur un module natif ggwave (non inclus dans ce MVP).
- **iOS** : reporté (nécessite macOS).
