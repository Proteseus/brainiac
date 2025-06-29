import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Copy, Check } from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';
import { useClipboard } from '@/hooks/useClipboard';

interface CopyButtonProps {
  text: string;
  onCopy?: (success: boolean, error?: string) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'text' | 'both';
  style?: any;
  disabled?: boolean;
}

export function CopyButton({
  text,
  onCopy,
  size = 'medium',
  variant = 'icon',
  style,
  disabled = false,
}: CopyButtonProps) {
  const { colors } = useTheme();
  const { copy, copied, isLoading, error } = useClipboard();

  const handleCopy = async () => {
    if (disabled || isLoading) return;

    const result = await copy(text);
    onCopy?.(result.success, result.error);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 28, height: 28, iconSize: 14 };
      case 'large':
        return { width: 44, height: 44, iconSize: 20 };
      default:
        return { width: 36, height: 36, iconSize: 16 };
    }
  };

  const buttonSize = getButtonSize();

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      {
        backgroundColor: copied 
          ? colors.primaryContainer 
          : colors.surfaceVariant,
        borderColor: copied 
          ? colors.primary 
          : colors.outline,
        width: variant === 'text' ? 'auto' : buttonSize.width,
        height: buttonSize.height,
        opacity: disabled ? 0.5 : 1,
      },
      style,
    ];

    if (variant === 'text' || variant === 'both') {
      baseStyle.push({ paddingHorizontal: spacing.sm });
    }

    return baseStyle;
  };

  const renderIcon = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={copied ? colors.onPrimaryContainer : colors.onSurfaceVariant}
        />
      );
    }

    const IconComponent = copied ? Check : Copy;
    return (
      <IconComponent
        size={buttonSize.iconSize}
        color={copied ? colors.onPrimaryContainer : colors.onSurfaceVariant}
      />
    );
  };

  const renderText = () => {
    if (variant === 'icon') return null;

    return (
      <Text
        style={[
          styles.buttonText,
          {
            color: copied ? colors.onPrimaryContainer : colors.onSurfaceVariant,
            marginLeft: variant === 'both' ? spacing.xs : 0,
          },
        ]}
      >
        {copied ? 'Copied!' : 'Copy'}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleCopy}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      accessibilityRole="button"
    >
      {variant !== 'text' && renderIcon()}
      {renderText()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});