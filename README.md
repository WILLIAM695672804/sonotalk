# SonoTalk

**Messagerie de proximité par le son.** SonoTalk transmet de courts messages texte
d'un appareil à un autre **uniquement avec le haut-parleur et le micro** — sans
Wi-Fi, sans Bluetooth, sans réseau. Le texte est encodé en signal acoustique
(audible ou ultrason), émis, capté par le micro d'en face, puis décodé.

> Projet tutoré — MVP fonctionnel (web + Android). Pas de comptes, pas de serveur,
> pas de persistance : une seule conversation éphémère, hors-ligne.

---

## Comment ça marche

```
[Appareil A]  texte ──► encodage ggwave ──► 🔊 son ))) 🎤 ──► décodage ggwave ──► texte  [Appareil B]
```

- **Moteur de transmission :** [ggwave](https://github.com/ggerganov/ggwave)
  (data-over-sound, correction d'erreurs intégrée), embarqué **localement** →
  fonctionne entièrement hors-ligne.
- **Modes :** son **audible** ou **ultrason** (quasi inaudible), chacun en débit
  **normal** ou **rapide**.
- **Charge utile :** `sessionId · pseudo · texte` (séparateur U+001F). Le `sessionId`
  aléatoire permet d'ignorer son propre écho capté par le micro ; le pseudo s'affiche
  sous les messages reçus.
- **Messages courts** (max 64 caractères) : le débit data-over-sound est faible,
  on borne pour rester fiable et rapide.
- **Jamais de charabia :** un signal capté mais non décodé est affiché comme une
  carte d'erreur explicite, jamais comme du texte brut.

## Plateformes

| Plateforme | Transmission sonore | Détail |
|------------|--------------------|--------|
| **Web** (navigateur) | ✅ | ggwave + Web Audio API directement dans la page. Démo principale. |
| **Android** (APK) | ✅ | ggwave tourne dans une WebView cachée pilotée par l'UI native (voir Architecture). |
| **iOS** | ⚠️ | Code web compatible (capture micro via AudioWorklet pour Safari iOS) ; pas de build natif fourni. |

## Stack

- **Expo SDK 56** · React Native 0.85 · React 19 · TypeScript (strict)
- **react-native-web** pour la cible web
- **ggwave** 0.4.0 (build single-file, WebAssembly embarqué en base64)
- **react-native-webview** (pont audio Android)

---

## Démarrer en local (web)

Prérequis : **Node.js LTS**.

```bash
npm install
npm run web        # → http://localhost:8081
```

Pour la démo de transmission, ouvre **deux fenêtres/onglets** (ou deux appareils) :
touche **« Écouter »** sur l'un, envoie un message depuis l'autre. Garde le même
mode des deux côtés, volume ~70 %, pièce calme, et autorise le micro.

> Sous Windows, le wrapper `run-web.cmd` injecte le PATH de Node **et démarre en
> parallèle un tunnel HTTPS** (voir ci-dessous).

## Tester sur téléphone (mode dev)

Le micro du navigateur exige une origine **HTTPS**. Un tunnel
[cloudflared](https://github.com/cloudflare/cloudflared) (sans compte) expose le
serveur de dev en HTTPS :

```bash
npm run web        # serveur web (port 8081)
npm run tunnel     # tunnel HTTPS → https://xxxx.trycloudflare.com
```

(`run-web.cmd` lance déjà les deux ensemble sous Windows.) Ouvre l'URL
`https://…trycloudflare.com` dans le navigateur du téléphone, autorise le micro.

## Générer l'APK Android

Le build passe par **EAS Build** (cloud Expo, compte gratuit requis) :

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```

EAS renvoie un lien de téléchargement de l'APK. À la première écoute, autorise
l'accès au micro lorsque l'app le demande.

---

## Architecture

```
App.tsx
├─ ConversationScreen / SettingsScreen / HelpScreen   UI native React Native
├─ useSoundMessaging (hook)                            état conversation, payload, 4 états
│   └─ createSoundEngine()                             contrat SoundEngine
│       ├─ soundEngine.ts          → Web   : ggwave + Web Audio dans le navigateur
│       └─ soundEngine.native.ts   → Android: délègue au pont WebView
└─ <SoundBridge/>                                      WebView cachée sur Android, null sur web
```

Le défi sur Android : React Native n'a pas la Web Audio API. La solution
pragmatique retenue est de faire tourner **le même ggwave que le web dans une
WebView cachée**, pilotée par un pont (`nativeSoundBridge.tsx`) : l'UI native
envoie des commandes (`send` / `startListening`), la WebView encode/décode et
renvoie progression, messages décodés et erreurs. ggwave y est injecté en base64
→ aucune dépendance réseau.

| Fichier | Rôle |
|---------|------|
| `src/audio/soundEngineTypes.ts` | Interface `SoundEngine` partagée web/natif |
| `src/audio/soundEngine.ts` | Implémentation **web** (ggwave + Web Audio) |
| `src/audio/soundEngine.native.ts` | Implémentation **Android** (via le pont) |
| `src/audio/nativeSoundBridge.tsx` | WebView cachée + pont + logique audio in-WebView |
| `src/audio/ggwaveSource.ts` | ggwave embarqué en base64 (généré, offline) |
| `src/hooks/useSoundMessaging.ts` | État de la conversation, format de charge utile |
| `src/components/` | Waveform, MessageBubble, StatusStrip, ModeToggle, Composer |

## État & limites

- ✅ Web : émission/réception audible & ultrason, normal & rapide.
- ✅ Android↔PC et Android↔Android via le navigateur du téléphone.
- 🔧 APK natif : moteur branché ; validation du son sur appareil en cours.
- Le passage acoustique réel dépend du matériel, du volume et du bruit ambiant.
- Pas de persistance entre sessions (conforme au cahier des charges).

## Licence

Projet académique. ggwave est distribué sous licence MIT.
