import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { Status } from '../types';

interface Props {
  status: Status;
  statusText: string;
  listening: boolean;
  progress: number;
  onToggleListen: () => void;
}

const PALETTE: Record<
  Status,
  { bg: string; fg: string; border: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  idle: { bg: colors.surface, fg: colors.textSecondary, border: colors.border, icon: 'ellipse-outline' },
  listening: { bg: colors.soundBg, fg: colors.soundText, border: colors.soundBorder, icon: 'mic' },
  emitting: { bg: colors.accentSoft, fg: colors.accentText, border: colors.accentSoft, icon: 'radio' },
  success: { bg: colors.successBg, fg: colors.success, border: colors.successBorder, icon: 'checkmark-circle' },
  error: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBorder, icon: 'alert-circle' },
};

function PulseDot({ color }: { color: string }) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.3, duration: 600, useNativeDriver: false }),
        Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity: a }]} />;
}

export function StatusStrip({ status, statusText, listening, progress, onToggleListen }: Props) {
  const p = PALETTE[status];

  return (
    <View style={[styles.wrap, { backgroundColor: p.bg, borderTopColor: p.border }]}>
      <View style={styles.left}>
        {status === 'listening' ? (
          <PulseDot color={p.fg} />
        ) : (
          <Ionicons name={p.icon} size={15} color={p.fg} />
        )}
        <Text style={[styles.text, { color: p.fg }]} numberOfLines={1}>
          {statusText}
        </Text>
      </View>

      {status === 'emitting' ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)} %</Text>
        </View>
      ) : (
        <Pressable
          onPress={onToggleListen}
          style={[styles.listenBtn, listening && styles.listenBtnActive]}
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Arrêter l’écoute' : 'Écouter'}
        >
          <Ionicons
            name={listening ? 'stop' : 'mic-outline'}
            size={14}
            color={listening ? colors.textOnAccent : colors.soundText}
          />
          <Text style={[styles.listenText, listening && styles.listenTextActive]}>
            {listening ? 'Stop' : 'Écouter'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  text: { fontSize: 12, fontWeight: '500', flexShrink: 1 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 130 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  progressText: { fontSize: 10, color: colors.accentText, fontVariant: ['tabular-nums'], width: 34, textAlign: 'right' },

  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
  },
  listenBtnActive: { backgroundColor: colors.danger },
  listenText: { fontSize: 12, fontWeight: '500', color: colors.soundText },
  listenTextActive: { color: colors.textOnAccent },
});
