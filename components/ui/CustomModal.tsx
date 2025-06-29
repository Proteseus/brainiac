import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';
import { Button } from './Button';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  dismissible?: boolean;
}

export function CustomModal({
  visible,
  onClose,
  type,
  title,
  message,
  primaryButton,
  secondaryButton,
  dismissible = true,
}: CustomModalProps) {
  const { colors } = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.primary;
      case 'error':
        return colors.error;
      case 'warning':
        return '#FF8C00'; // Orange
      case 'info':
      default:
        return colors.tertiary;
    }
  };

  const Icon = getIcon();
  const iconColor = getIconColor();

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissible ? onClose : undefined}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Icon size={32} color={iconColor} />
                </View>
                {dismissible && (
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={20} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={[styles.title, { color: colors.onSurface }]}>
                  {title}
                </Text>
                <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
                  {message}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {secondaryButton && (
                  <Button
                    title={secondaryButton.text}
                    onPress={secondaryButton.onPress}
                    variant="outlined"
                    style={styles.secondaryButton}
                  />
                )}
                {primaryButton && (
                  <Button
                    title={primaryButton.text}
                    onPress={primaryButton.onPress}
                    style={styles.primaryButton}
                  />
                )}
                {!primaryButton && !secondaryButton && (
                  <Button
                    title="OK"
                    onPress={onClose}
                    style={styles.primaryButton}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxWidth: 400,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: spacing.xs,
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  content: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
});