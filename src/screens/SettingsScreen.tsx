import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ModeToggle } from '../components/ModeToggle';
import { colors, radius } from '../theme';
import { SoundMode, Speed } from '../types';

interface Props {
  nick: string;
  mode: SoundMode;
  speed: Speed;
  onChangeNick: (nick: string) => void;
  onChangeMode: (mode: SoundMode) => void;
  onChangeSpeed: (speed: Speed) => void;
  onClose: () => void;
}

export function SettingsScreen({
  nick,
  mode,
  speed,
  onChangeNick,
  onChangeMode,
  onChangeSpeed,
  onClose,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Réglages</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Transmission</Text>

        <Text style={styles.label}>Mode</Text>
        <ModeToggle mode={mode} onChange={onChangeMode} />
        <Text style={styles.hint}>
          Audible : robuste et entendu. Ultrason : silencieux, dépend du matériel.
        </Text>

        <Text style={styles.label}>Vitesse</Text>
        <View style={styles.track}>
          <SpeedSeg label="Normal" active={speed === 'normal'} onPress={() => onChangeSpeed('normal')} />
          <SpeedSeg label="Rapide" active={speed === 'fast'} onPress={() => onChangeSpeed('fast')} />
        </View>
        <Text style={styles.hint}>Rapide : transmission plus courte, un peu moins fiable.</Text>

        <Text style={styles.section}>Identité</Text>
        <Text style={styles.label}>Pseudo</Text>
        <TextInput
          value={nick}
          onChangeText={(t) => onChangeNick(t.slice(0, 16))}
          placeholder="Votre pseudo"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          maxLength={16}
        />
        <Text style={styles.hint}>Joint à chaque message et utilisé pour ignorer son propre écho.</Text>

        <View style={styles.warn}>
          <Ionicons name="warning" size={16} color={colors.warnText} />
          <Text style={styles.warnText}>
            Les deux appareils doivent partager le même mode et la même vitesse pour se comprendre.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SpeedSeg({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.seg, active && styles.segActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.segText, { color: active ? colors.textOnAccent : colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },

  content: { padding: 16, paddingBottom: 32 },
  section: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 18,
    marginBottom: 10,
  },
  label: { fontSize: 12.5, color: colors.textPrimary, marginBottom: 6, marginTop: 6 },
  hint: { fontSize: 10.5, color: colors.textSecondary, marginTop: 6, lineHeight: 15 },

  track: { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: radius.md, padding: 3 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm },
  segActive: { backgroundColor: colors.accent },
  segText: { fontSize: 12, fontWeight: '500' },

  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: colors.textPrimary,
  },

  warn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.warnBg,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 24,
  },
  warnText: { flex: 1, fontSize: 11, color: colors.warnText, lineHeight: 16 },
});
