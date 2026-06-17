import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  color: string;
  active?: boolean;
  height?: number;
  bars?: number;
}

// Forme d'onde animée — élément « héros » de l'identité sonore.
// Utilisée pendant l'émission et la réception.
export function Waveform({ color, active = true, height = 36, bars = 24 }: Props) {
  const values = useRef(
    Array.from({ length: bars }, () => new Animated.Value(0.35)),
  ).current;

  useEffect(() => {
    if (!active) {
      values.forEach((v) => v.stopAnimation());
      return;
    }
    const animations = values.map((v, i) => {
      const dur = 280 + (i % 5) * 70;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: USE_NATIVE }),
          Animated.timing(v, { toValue: 0.35, duration: dur, useNativeDriver: USE_NATIVE }),
        ]),
      );
    });
    const starts = animations.map((a, i) => setTimeout(() => a.start(), i * 35));
    return () => {
      starts.forEach(clearTimeout);
      animations.forEach((a) => a.stop());
    };
  }, [active, values]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        gap: 3,
      }}
    >
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: height * 0.85,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ scaleY: v }],
          }}
        />
      ))}
    </View>
  );
}
