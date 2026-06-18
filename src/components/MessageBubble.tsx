import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { Message } from '../types';

function timeLabel(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

interface Props {
  message: Message;
  onReplay?: (text: string) => void;
}

export function MessageBubble({ message, onReplay }: Props) {
  // F-13 / CA-06 : signal capté mais illisible → carte d'erreur, jamais de texte brut.
  if (message.kind === 'error') {
    return (
      <View style={styles.errorCard}>
        <Ionicons name="alert-circle" size={20} color={colors.danger} />
        <View style={styles.errorBody}>
          <Text style={styles.errorTitle}>Message illisible</Text>
          <Text style={styles.errorText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  const mine = message.sender === 'me';

  return (
    <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
      <View style={mine ? styles.bubbleSent : styles.bubbleReceived}>
        {!mine && message.nick ? <Text style={styles.nick}>{message.nick}</Text> : null}
        <Text style={mine ? styles.textSent : styles.textReceived}>{message.text}</Text>
      </View>

      <View style={[styles.meta, mine ? styles.metaRight : styles.metaLeft]}>
        {mine ? (
          <>
            <Pressable
              onPress={() => onReplay?.(message.text)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Rejouer ce message"
            >
              <Ionicons name="refresh" size={13} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.metaText}>{timeLabel(message.ts)}</Text>
            <Ionicons name="checkmark-done" size={13} color={colors.sound} />
          </>
        ) : (
          <>
            <Ionicons name="pulse" size={12} color={colors.sound} />
            <Text style={styles.metaText}>reçu par le son · {timeLabel(message.ts)}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12, maxWidth: '82%' },
  rowLeft: { alignSelf: 'flex-start' },
  rowRight: { alignSelf: 'flex-end' },

  bubbleReceived: {
    backgroundColor: colors.bubbleReceived,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
  },
  bubbleSent: {
    backgroundColor: colors.bubbleSent,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  nick: { fontSize: 11, fontWeight: '500', color: colors.accentText, marginBottom: 2 },
  textReceived: { fontSize: 14, color: colors.textPrimary },
  textSent: { fontSize: 14, color: colors.textOnAccent },

  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaLeft: { justifyContent: 'flex-start', paddingLeft: 4 },
  metaRight: { justifyContent: 'flex-end', paddingRight: 4 },
  metaText: { fontSize: 10, color: colors.textSecondary },

  errorCard: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    backgroundColor: colors.dangerBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorBody: { flex: 1 },
  errorTitle: { fontSize: 12.5, fontWeight: '500', color: colors.danger, marginBottom: 2 },
  errorText: { fontSize: 11.5, color: colors.dangerSoft, lineHeight: 16 },
});
