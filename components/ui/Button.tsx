import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, borderRadius, shadows } from '@/constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'filled':
        return [
          ...baseStyle,
          {
            backgroundColor: disabled ? colors.surfaceVariant : colors.primary,
          },
          shadows.sm,
        ];
      case 'outlined':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled ? colors.outline : colors.primary,
          },
        ];
      case 'text':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
          },
        ];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          color: disabled ? colors.onSurfaceVariant : colors.onPrimary,
          fontWeight: '600' as const,
        };
      case 'outlined':
      case 'text':
        return {
          color: disabled ? colors.onSurfaceVariant : colors.primary,
          fontWeight: '600' as const,
        };
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? colors.onPrimary : colors.primary}
        />
      ) : (
        <Text style={[styles.text, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 40,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 48,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});