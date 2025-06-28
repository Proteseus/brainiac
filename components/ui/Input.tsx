import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, style, ...props }: InputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.outline,
            color: colors.onSurface,
          },
          style,
        ]}
        placeholderTextColor={colors.onSurfaceVariant}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <Text style={[styles.helperText, { color: colors.error }]}>
          {error}
        </Text>
      )}
      {helper && !error && (
        <Text style={[styles.helperText, { color: colors.onSurfaceVariant }]}>
          {helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 48,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: spacing.xs,
  },
});