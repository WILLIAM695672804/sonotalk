import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Composer } from '../components/Composer';
import { MessageBubble } from '../components/MessageBubble';
import { ModeToggle } from '../components/ModeToggle';
import { StatusStrip } from '../components/StatusStrip';
import { Waveform } from '../components/Waveform';
import { useSoundMessaging } from '../hooks/useSoundMessaging';
import { colors } from '../theme';
import { SoundMode, Speed } from '../types';

interface Props {
  nick: string;
  mode: SoundMode;
  speed: Speed;
  onChangeMode: (mode: SoundMode) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export function ConversationScreen({
  nick,
  mode,
  speed,
  onChangeMode,
  onOpenSettings,
  onOpenHelp,
}: Props) {
  const { messages, status, statusText, listening, progress, ready, send, replay, toggleListening } =
    useSoundMessaging(nick, mode, speed);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Suivi manuel du clavier : en mode edge-to-edge (SDK 56) la fenêtre ne se
  // redimensionne pas, donc on remonte nous-mêmes la zone de saisie. Clavier
  // fermé → on respecte l'inset de la barre de navigation système.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
    const h = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);
  const bottomPad = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="pulse" size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>SonoTalk</Text>
          <Text style={styles.subtitle}>
            mode {mode === 'audible' ? 'audible' : 'ultrason'} · {speed === 'fast' ? 'rapide' : 'normal'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={onOpenHelp}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Aide"
          >
            <Ionicons name="help-circle-outline" size={23} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onOpenSettings}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Réglages"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.modeBar}>
        <ModeToggle mode={mode} onChange={onChangeMode} compact />
      </View>

      <View style={styles.body}>
        {messages.length === 0 ? (
          <EmptyState ready={ready} listening={listening} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} onReplay={replay} />
            ))}
          </ScrollView>
        )}

        {status === 'emitting' ? (
          <View style={styles.wavePanel}>
            <Waveform color={mode === 'ultrasound' ? colors.sound : colors.accent} height={34} />
          </View>
        ) : null}

        <StatusStrip
          status={status}
          statusText={statusText}
          listening={listening}
          progress={progress}
          onToggleListen={toggleListening}
        />

        <View style={{ paddingBottom: bottomPad }}>
          <Composer onSend={send} disabled={status === 'emitting' || !ready} />
        </View>
      </View>
    </View>
  );
}

function EmptyState({ ready, listening }: { ready: boolean; listening: boolean }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="pulse" size={34} color={colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Aucun message</Text>
      <Text style={styles.emptyText}>
        {ready
          ? listening
            ? 'Le micro écoute. Approchez un autre appareil et envoyez votre premier message par le son.'
            : 'Touchez « Écouter » pour recevoir, ou envoyez votre premier message par le son.'
          : 'Transmission sonore indisponible sur cette plateforme. Ouvrez la version web pour la démo.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  subtitle: { fontSize: 11, color: colors.textSecondary },

  modeBar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  body: { flex: 1 },
  list: { flex: 1 },
  listContent: { padding: 14, paddingBottom: 18 },

  wavePanel: {
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  emptyText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
