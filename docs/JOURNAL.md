# Journal d'avancement — SonoTalk

> Messagerie par ondes sonores (ggwave + React Native/Expo). MVP de projet tutoré.
> Ce document est le journal de bord du développement, tenu à jour à chaque étape.

---

## 2026-06-17 — Initialisation + MVP web fonctionnel

### Décisions clés
- **Charte visuelle** : mode clair (« variante B », façon iMessage/Telegram),
  accent indigo (ce qui part) + teal (le son). Forme d'onde comme élément héros.
- **Bibliothèque** : ggwave (MIT), **hébergée localement** dans `public/vendor/ggwave.js`
  (build single-file 0.4.0, wasm embarqué) → fonctionne hors-ligne.
- **Plateforme** : Expo Web comme environnement de dev/démo principal ; Android dev
  build reporté (module natif ggwave non intégré).

### État d'avancement par exigence

**Réalisées**
| ID | Exigence | ID | Exigence |
|---|---|---|---|
| F-01 | Saisir + émettre par le son | F-10 | Historique pendant la session |
| F-02 | Écouter + décoder | F-11 | État « émission en cours » |
| F-03 | Bascule audible / ultrason | F-12 | Indicateur micro à l'écoute |
| F-04 | Vitesse normal / rapide | F-14 | Barre de progression |
| F-05 | Limite + compteur de caractères | NF-01 | Fiabilité (FEC ggwave) |
| F-06 | Historique en bulles | NF-02 | États visibles d'un coup d'œil |
| F-07 | Distinction envoyés / reçus | NF-04 | Hors-ligne |
| F-08 | Horodatage | NF-05 | Confidentialité (100 % local) |
| F-09 | Pseudo encodé + affiché | NF-07 | Changement de mode à chaud |

**Partielles** : F-13 (erreurs émission/micro gérées ; « reçu mais illisible » à coder),
F-15 (forme d'onde animée, pas de spectre), F-19 (thème clair fait, sombre non),
NF-03/NF-06 (web OK, natif = stub ; perf non testée sous charge).

**Non faites** : F-16 (ACK), F-17 (écran d'aide), F-18 (rejouer) — toutes *Could*/*Should*.

### Ce qui est vérifié (preuves)
- `tsc --noEmit` : 0 erreur.
- Bundle web compile ; écrans Conversation + Réglages conformes à la maquette.
- Aller-retour ggwave encode→décode : OK en audible normal/rapide et ultrason.
- **Décodage temps réel** via le graphe Web Audio (BufferSource → MediaStream →
  ScriptProcessor par paquets) : « PCtoPC OK » émis puis décodé, 126 paquets sur
  1,58 s à 48 kHz. C'est le code exact de l'écoute, prouvé de bout en bout.
- Envoi réel déclenché depuis l'app : message émis, statut géré, 0 erreur console.
- ggwave chargé depuis le fichier local (aucun CDN sollicité).

### La seule chose jamais testée en conditions réelles
Toute la chaîne **logicielle** est prouvée, **y compris le décodage temps réel en
flux**. La seule inconnue restante est purement **physique** : le passage
haut-parleur → air → micro entre deux appareils, qui dépend du matériel, du volume
et du bruit ambiant. Il se valide manuellement (test PC↔PC ci-dessous) et ne peut
pas être automatisé sans micro réel.

### Prochaines étapes (par priorité)
1. **Valider le passage acoustique réel** (PC↔PC, deux onglets, micro du PC).
2. **F-13** — erreur de réception lisible (Must + critère d'acceptation CA-06).
3. **F-17** — écran d'aide/onboarding (explique le concept au jury).
4. Confort, si le temps le permet : F-19 (thème sombre), F-16 (ACK), F-18 (rejouer).

### Protocole de test acoustique PC↔PC
1. `npm run web`, ouvrir **deux fenêtres** du navigateur sur http://localhost:8081.
2. Sur un PC avec **haut-parleur + micro** (un portable suffit), volume raisonnable,
   pièce calme, mode **Audible / Normal** des deux côtés.
3. Fenêtre B (récepteur) : cliquer **« Écouter »**, autoriser le micro.
4. Fenêtre A (émetteur) : taper un message court, **envoyer**.
5. Attendu : le message apparaît dans B comme reçu (les sessionId distincts évitent
   que B prenne le signal pour son propre écho).

---

## 2026-06-18 — Partie web complétée (F-13, F-17, F-18)

### Ajouté
- **F-13** (erreur de réception lisible) — tout signal décodé qui n'a pas la structure
  attendue (sessionId · pseudo · texte), tronqué, ou contenant des octets corrompus
  (U+FFFD), s'affiche comme une **carte d'erreur** rouge — jamais en charabia.
  Satisfait CA-06.
- **F-17** (écran d'aide) — 4 étapes + « C'est parti », accessible par l'icône « ? »
  de l'en-tête.
- **F-18** (rejouer) — icône sur chaque message envoyé pour ré-émettre son audio,
  sans créer de nouvelle bulle.

### Vérifié
- `tsc` 0 erreur ; écran d'aide + carte d'erreur présents dans le bundle.
- L'écran d'aide s'affiche, l'icône « rejouer » est sur les bulles envoyées, l'envoi
  fonctionne, 0 erreur console.
- Logique F-13 testée : message valide → affiché ; source étrangère / tronqué /
  corrompu → carte d'erreur.

### Critères d'acceptation (web)
- ✅ **CA-03, CA-04, CA-05, CA-06, CA-07** remplis.
- ⏳ **CA-01, CA-02** : dépendent du seul test non automatisable — le passage
  physique haut-parleur → air → micro, à valider sur matériel réel.

### Reste (confort, *Could*, hors critères)
- F-19 (thème sombre) : refactor d'un contexte de thème — reporté.
- F-16 (ACK sonore) : risque de boucle audio — écarté pour l'instant.
- F-15 : forme d'onde animée présente, spectre temps réel non.

**Conclusion :** la partie web est complète au sens des *Must* + *Should*, et les
5 critères d'acceptation codables sont remplis. Les 2 derniers (CA-01/CA-02) ne
tiennent plus qu'au test acoustique physique.
