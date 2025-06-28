import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/constants/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  blur?: boolean;
}

export function GlassCard({ children, style, intensity = 20, blur = true }: GlassCardProps) {
  const { colors, isDark } = useTheme();

  if (!blur) {
    return (
      <View style={[
        styles.container,
        {
          backgroundColor: colors.glassSurface,
          borderColor: colors.outlineVariant,
        },
        style
      ]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.container,
        {
          backgroundColor: colors.glassOverlay,
          borderColor: colors.outlineVariant,
        },
        style
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});