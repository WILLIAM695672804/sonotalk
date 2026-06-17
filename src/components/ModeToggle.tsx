import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { SoundMode } from '../types';

interface Props {
  mode: SoundMode;
  onChange: (mode: SoundMode) => void;
  compact?: boolean;
}

// Bascule audible/ultrason (F-03). Réversible à chaud, sans redémarrage (NF-07).
export function ModeToggle({ mode, onChange, compact = false }: Props) {
  return (
    <View style={[styles.track, compact && styles.trackCompact]}>
      <Segment
        active={mode === 'audible'}
        label="Audible"
        icon="volume-medium"
        compact={compact}
        onPress={() => onChange('audible')}
      />
      <Segment
        active={mode === 'ultrasound'}
        label="Ultrason"
        icon="pulse"
        compact={compact}
        onPress={() => onChange('ultrasound')}
      />
    </View>
  );
}

function Segment({
  active,
  label,
  icon,
  compact,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segment,
        compact && styles.segmentCompact,
        active && styles.segmentActive,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons
        name={icon}
        size={compact ? 12 : 15}
        color={active ? colors.textOnAccent : colors.textSecondary}
      />
      <Text
        style={[
          compact ? styles.labelCompact : styles.label,
          { color: active ? colors.textOnAccent : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: 3,
  },
  trackCompact: { borderRadius: radius.pill, padding: 2 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  segmentCompact: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: radius.pill },
  segmentActive: { backgroundColor: colors.accent },
  label: { fontSize: 12, fontWeight: '500' },
  labelCompact: { fontSize: 10, fontWeight: '500' },
});
