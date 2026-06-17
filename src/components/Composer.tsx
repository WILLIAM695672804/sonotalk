import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, MAX_CHARS } from '../theme';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function Composer({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={(t) => setValue(t.slice(0, MAX_CHARS))}
          placeholder="Message court…"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          editable={!disabled}
          maxLength={MAX_CHARS}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Text style={styles.counter}>
          {value.length}/{MAX_CHARS}
        </Text>
      </View>

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Envoyer par le son"
      >
        <Ionicons name="arrow-up" size={18} color={colors.textOnAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  counter: { fontSize: 10, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7CBF5' },
});
