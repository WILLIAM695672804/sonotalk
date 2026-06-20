import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConversationScreen } from './src/screens/ConversationScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SoundBridge } from './src/audio/SoundBridge';
import { colors } from './src/theme';
import { SoundMode, Speed } from './src/types';

type Screen = 'chat' | 'settings' | 'help';

function AppContent() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('chat');
  const [nick, setNick] = useState('Moi');
  const [mode, setMode] = useState<SoundMode>('audible');
  const [speed, setSpeed] = useState<Speed>('normal');

  return (
    <View style={styles.outer}>
      <View style={[styles.frame, { paddingTop: insets.top }]}>
        {screen === 'chat' ? (
          <ConversationScreen
            nick={nick}
            mode={mode}
            speed={speed}
            onChangeMode={setMode}
            onOpenSettings={() => setScreen('settings')}
            onOpenHelp={() => setScreen('help')}
          />
        ) : screen === 'settings' ? (
          <SettingsScreen
            nick={nick}
            mode={mode}
            speed={speed}
            onChangeNick={setNick}
            onChangeMode={setMode}
            onChangeSpeed={setSpeed}
            onClose={() => setScreen('chat')}
          />
        ) : (
          <HelpScreen onClose={() => setScreen('chat')} />
        )}
      </View>
      {/* WebView audio cachée (Android) ; null sur le web. */}
      <SoundBridge />
      <StatusBar style="dark" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Sur le web, on centre une colonne « téléphone » sur une surface neutre.
  outer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? colors.surface : colors.bg,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 460 : undefined,
    backgroundColor: colors.bg,
  },
});
