import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

const STEPS: { title: string; text: string }[] = [
  {
    title: 'Rapprochez les appareils',
    text: 'Moins d’un mètre, micros face aux haut-parleurs.',
  },
  {
    title: 'Même mode des deux côtés',
    text: 'Audible ou ultrason — identique pour l’émetteur et le récepteur.',
  },
  {
    title: 'L’un écrit, l’autre écoute',
    text: 'Le message est joué puis décodé automatiquement.',
  },
  {
    title: 'Au calme, c’est mieux',
    text: 'Le bruit ambiant peut gêner le décodage.',
  },
];

export function HelpScreen({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Comment ça marche</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="pulse" size={40} color={colors.sound} />
          <Text style={styles.heroTitle}>Parler par le son</Text>
          <Text style={styles.heroText}>Sans réseau, sans Wi-Fi, sans Bluetooth.</Text>
        </View>

        {STEPS.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.num}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}

        <Pressable onPress={onClose} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>C’est parti</Text>
        </Pressable>
      </ScrollView>
    </View>
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

  content: { padding: 20, paddingBottom: 32 },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 16, fontWeight: '500', color: colors.textPrimary, marginTop: 8 },
  heroText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 18 },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 13, fontWeight: '500', color: colors.accentText },
  stepBody: { flex: 1, paddingTop: 2 },
  stepTitle: { fontSize: 13.5, fontWeight: '500', color: colors.textPrimary },
  stepText: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },

  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { fontSize: 14, fontWeight: '500', color: colors.textOnAccent },
});
