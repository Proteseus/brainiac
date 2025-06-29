import { useState } from 'react';

interface ModalState {
  visible: boolean;
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

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    dismissible: true,
  });

  const showModal = (config: Omit<ModalState, 'visible'>) => {
    setModalState({
      ...config,
      visible: true,
    });
  };

  const hideModal = () => {
    setModalState(prev => ({
      ...prev,
      visible: false,
    }));
  };

  const showSuccess = (title: string, message: string, onOk?: () => void) => {
    showModal({
      type: 'success',
      title,
      message,
      primaryButton: onOk ? {
        text: 'OK',
        onPress: () => {
          hideModal();
          onOk();
        },
      } : undefined,
    });
  };

  const showError = (title: string, message: string, onRetry?: () => void) => {
    showModal({
      type: 'error',
      title,
      message,
      primaryButton: onRetry ? {
        text: 'Retry',
        onPress: () => {
          hideModal();
          onRetry();
        },
      } : undefined,
      secondaryButton: onRetry ? {
        text: 'Cancel',
        onPress: hideModal,
      } : undefined,
    });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: 'warning',
      title,
      message,
      primaryButton: onConfirm ? {
        text: 'Continue',
        onPress: () => {
          hideModal();
          onConfirm();
        },
      } : undefined,
      secondaryButton: onConfirm ? {
        text: 'Cancel',
        onPress: hideModal,
      } : undefined,
    });
  };

  const showInfo = (title: string, message: string, onOk?: () => void) => {
    showModal({
      type: 'info',
      title,
      message,
      primaryButton: onOk ? {
        text: 'OK',
        onPress: () => {
          hideModal();
          onOk();
        },
      } : undefined,
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ) => {
    showModal({
      type: 'warning',
      title,
      message,
      primaryButton: {
        text: confirmText,
        onPress: () => {
          hideModal();
          onConfirm();
        },
      },
      secondaryButton: {
        text: cancelText,
        onPress: () => {
          hideModal();
          onCancel?.();
        },
      },
      dismissible: false,
    });
  };

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}