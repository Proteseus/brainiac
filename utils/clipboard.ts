import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export interface ClipboardResult {
  success: boolean;
  error?: string;
}

/**
 * Copy text to clipboard with cross-platform support
 * @param text - The text to copy to clipboard
 * @returns Promise<ClipboardResult> - Result of the copy operation
 */
export const copyToClipboard = async (text: string): Promise<ClipboardResult> => {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: 'No text provided to copy'
    };
  }

  try {
    if (Platform.OS === 'web') {
      // Web platform - use modern Clipboard API with fallback
      if (navigator.clipboard && window.isSecureContext) {
        // Modern Clipboard API (requires HTTPS or localhost)
        await navigator.clipboard.writeText(text);
        return { success: true };
      } else {
        // Fallback for older browsers or non-secure contexts
        return await fallbackCopyToClipboard(text);
      }
    } else {
      // Mobile platforms (iOS/Android) - use Expo Clipboard
      await Clipboard.setStringAsync(text);
      return { success: true };
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    
    // Try fallback method on web if modern API fails
    if (Platform.OS === 'web') {
      return await fallbackCopyToClipboard(text);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy to clipboard'
    };
  }
};

/**
 * Fallback copy method for web browsers that don't support modern Clipboard API
 * @param text - The text to copy
 * @returns Promise<ClipboardResult>
 */
const fallbackCopyToClipboard = async (text: string): Promise<ClipboardResult> => {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible but still selectable
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    
    // Add to DOM, select, copy, and remove
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return { success: true };
    } else {
      throw new Error('execCommand copy failed');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Fallback copy method failed. Your browser may not support clipboard operations.'
    };
  }
};

/**
 * Read text from clipboard (if supported)
 * @returns Promise<string | null> - The clipboard text or null if not available
 */
export const readFromClipboard = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      if (navigator.clipboard && window.isSecureContext) {
        return await navigator.clipboard.readText();
      } else {
        // Reading from clipboard is not supported in fallback mode
        return null;
      }
    } else {
      // Mobile platforms
      return await Clipboard.getStringAsync();
    }
  } catch (error) {
    console.error('Read from clipboard failed:', error);
    return null;
  }
};

/**
 * Check if clipboard operations are supported
 * @returns boolean - Whether clipboard operations are available
 */
export const isClipboardSupported = (): boolean => {
  if (Platform.OS === 'web') {
    return !!(navigator.clipboard || document.execCommand);
  } else {
    return true; // Expo Clipboard is always available on mobile
  }
};