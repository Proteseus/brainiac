import { useState } from 'react';
import { copyToClipboard, readFromClipboard, ClipboardResult } from '@/utils/clipboard';

export interface UseClipboardReturn {
  copy: (text: string) => Promise<ClipboardResult>;
  read: () => Promise<string | null>;
  copied: boolean;
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook for clipboard operations with state management
 * @param resetDelay - Time in milliseconds to reset the copied state (default: 2000)
 * @returns UseClipboardReturn
 */
export const useClipboard = (resetDelay: number = 2000): UseClipboardReturn => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copy = async (text: string): Promise<ClipboardResult> => {
    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const result = await copyToClipboard(text);
      
      if (result.success) {
        setCopied(true);
        // Reset copied state after delay
        setTimeout(() => setCopied(false), resetDelay);
      } else {
        setError(result.error || 'Copy failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const read = async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const text = await readFromClipboard();
      return text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to read clipboard';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    copy,
    read,
    copied,
    error,
    isLoading,
  };
};