import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { Message } from '../types';

function timeLabel(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function MessageBubble({ message }: { message: Message }) {
  const mine = message.sender === 'me';

  return (
    <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
      <View style={mine ? styles.bubbleSent : styles.bubbleReceived}>
        {!mine && message.nick ? (
          <Text style={styles.nick}>{message.nick}</Text>
        ) : null}
        <Text style={mine ? styles.textSent : styles.textReceived}>{message.text}</Text>
      </View>

      <View style={[styles.meta, mine ? styles.metaRight : styles.metaLeft]}>
        {mine ? (
          <>
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
  nick: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.accentText,
    marginBottom: 2,
  },
  textReceived: { fontSize: 14, color: colors.textPrimary },
  textSent: { fontSize: 14, color: colors.textOnAccent },

  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaLeft: { justifyContent: 'flex-start', paddingLeft: 4 },
  metaRight: { justifyContent: 'flex-end', paddingRight: 4 },
  metaText: { fontSize: 10, color: colors.textSecondary },
});
