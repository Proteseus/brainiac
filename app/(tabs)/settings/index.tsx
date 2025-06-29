import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, User, Key, Brain, Palette, Bell, ChevronRight, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomModal } from '@/components/ui/CustomModal';
import { useModal } from '@/hooks/useModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserSettings {
  preferred_ai_provider: 'deepseek' | 'gemini';
  theme_preference: 'light' | 'dark' | 'system';
  deepseek_api_key: string | null;
  gemini_api_key: string | null;
  notifications_enabled: boolean;
}

const LOCAL_STORAGE_KEYS = {
  DEEPSEEK_API_KEY: 'deepseek_api_key',
  GEMINI_API_KEY: 'gemini_api_key',
  PREFERRED_AI_PROVIDER: 'preferred_ai_provider',
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepseekKey, setDeepseekKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [preferredProvider, setPreferredProvider] = useState<'deepseek' | 'gemini'>('deepseek');

  useEffect(() => {
    if (user) {
      loadUserSettings();
    } else {
      loadLocalSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setDeepseekKey(data.deepseek_api_key || '');
        setGeminiKey(data.gemini_api_key || '');
        setPreferredProvider(data.preferred_ai_provider || 'deepseek');
      } else {
        // Create default settings if they don't exist
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      showError(
        'Settings Error',
        'Failed to load your settings. Please try again.',
        loadUserSettings
      );
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          preferred_ai_provider: 'deepseek',
          theme_preference: 'system',
          notifications_enabled: true,
        });

      if (error) throw error;
      
      // Reload settings after creation
      await loadUserSettings();
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const loadLocalSettings = async () => {
    try {
      const [deepseek, gemini, provider] = await Promise.all([
        AsyncStorage.getItem(LOCAL_STORAGE_KEYS.DEEPSEEK_API_KEY),
        AsyncStorage.getItem(LOCAL_STORAGE_KEYS.GEMINI_API_KEY),
        AsyncStorage.getItem(LOCAL_STORAGE_KEYS.PREFERRED_AI_PROVIDER),
      ]);

      setDeepseekKey(deepseek || '');
      setGeminiKey(gemini || '');
      setPreferredProvider((provider as 'deepseek' | 'gemini') || 'deepseek');
    } catch (error) {
      console.error('Error loading local settings:', error);
      showError(
        'Storage Error',
        'Failed to load your local settings. Please check your device storage.',
        loadLocalSettings
      );
    }
  };

  const saveApiKeys = async () => {
    setLoading(true);
    try {
      if (user) {
        // Save to Supabase for authenticated users
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            deepseek_api_key: deepseekKey.trim() || null,
            gemini_api_key: geminiKey.trim() || null,
            preferred_ai_provider: preferredProvider,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
        await loadUserSettings();
      } else {
        // Save to local storage for guest users
        await Promise.all([
          AsyncStorage.setItem(LOCAL_STORAGE_KEYS.DEEPSEEK_API_KEY, deepseekKey.trim()),
          AsyncStorage.setItem(LOCAL_STORAGE_KEYS.GEMINI_API_KEY, geminiKey.trim()),
          AsyncStorage.setItem(LOCAL_STORAGE_KEYS.PREFERRED_AI_PROVIDER, preferredProvider),
        ]);
      }

      showSuccess(
        'Settings Saved',
        'Your API keys and preferences have been saved successfully.'
      );
    } catch (error) {
      console.error('Error saving API keys:', error);
      showError(
        'Save Failed',
        'Failed to save your API keys. Please check your connection and try again.',
        saveApiKeys
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    showConfirm(
      'Sign Out',
      'Are you sure you want to sign out? Your local settings will be preserved.',
      async () => {
        try {
          const { error } = await signOut();
          if (error) {
            showError(
              'Sign Out Failed',
              'Failed to sign out. Please try again.'
            );
          }
        } catch (error) {
          showError(
            'Sign Out Error',
            'An unexpected error occurred while signing out.'
          );
        }
      },
      undefined,
      'Sign Out',
      'Cancel'
    );
  };

  const settingsItems = user ? [
    {
      icon: User,
      title: 'Profile',
      description: 'Manage your account information',
      onPress: () => router.push('/settings/profile'),
      showChevron: true,
    },
    {
      icon: Brain,
      title: 'AI Provider',
      description: settings?.preferred_ai_provider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini',
      onPress: () => {},
      showChevron: false,
    },
    {
      icon: Palette,
      title: 'Theme',
      description: settings?.theme_preference === 'system' ? 'System' : 
                   settings?.theme_preference === 'dark' ? 'Dark' : 'Light',
      onPress: () => {},
      showChevron: false,
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: settings?.notifications_enabled ? 'Enabled' : 'Disabled',
      onPress: () => {},
      showChevron: false,
    },
  ] : [
    {
      icon: Brain,
      title: 'AI Provider',
      description: preferredProvider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini',
      onPress: () => {},
      showChevron: false,
    },
    {
      icon: Palette,
      title: 'Theme',
      description: 'System',
      onPress: () => {},
      showChevron: false,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '20', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Settings size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {user ? 'Manage your account and preferences' : 'Configure your AI analysis settings'}
          </Text>
        </View>

        {/* Sign In Prompt for Guest Users */}
        {!user && (
          <GlassCard style={styles.signInPrompt}>
            <User size={32} color={colors.primary} />
            <Text style={[styles.signInTitle, { color: colors.onSurface }]}>
              Get More Features
            </Text>
            <Text style={[styles.signInText, { color: colors.onSurfaceVariant }]}>
              Sign in to sync your settings across devices, save analysis history, and access advanced features.
            </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/auth')}
              style={styles.signInButton}
            />
          </GlassCard>
        )}

        {/* Settings Items */}
        <GlassCard style={styles.settingsCard}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                index < settingsItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.outlineVariant,
                }
              ]}
              onPress={item.onPress}
              disabled={!item.showChevron}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primaryContainer }]}>
                  <item.icon size={20} color={colors.primary} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.onSurfaceVariant }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              {item.showChevron && (
                <ChevronRight size={20} color={colors.onSurfaceVariant} />
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* AI Provider Selection */}
        <GlassCard style={styles.providerCard}>
          <View style={styles.sectionHeader}>
            <Brain size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              AI Provider Preference
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
            Choose your preferred AI provider for document analysis.
          </Text>
          
          <View style={styles.providerButtons}>
            <Button
              title="DeepSeek AI"
              onPress={() => setPreferredProvider('deepseek')}
              variant={preferredProvider === 'deepseek' ? 'filled' : 'outlined'}
              style={styles.providerButton}
            />
            <Button
              title="Google Gemini"
              onPress={() => setPreferredProvider('gemini')}
              variant={preferredProvider === 'gemini' ? 'filled' : 'outlined'}
              style={styles.providerButton}
            />
          </View>
        </GlassCard>

        {/* API Keys */}
        <GlassCard style={styles.apiKeysCard}>
          <View style={styles.sectionHeader}>
            <Key size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              AI API Keys
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
            Configure your API keys for DeepSeek AI and Google Gemini to enable document analysis.
            {!user && ' Your keys are stored securely on your device.'}
          </Text>
          
          <Input
            label="DeepSeek API Key"
            placeholder="Enter your DeepSeek API key"
            value={deepseekKey}
            onChangeText={setDeepseekKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Input
            label="Google Gemini API Key"
            placeholder="Enter your Gemini API key"
            value={geminiKey}
            onChangeText={setGeminiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Button
            title="Save Settings"
            onPress={saveApiKeys}
            loading={loading}
            style={styles.saveButton}
          />
        </GlassCard>

        {/* API Key Help */}
        <GlassCard style={styles.helpCard}>
          <Text style={[styles.helpTitle, { color: colors.onSurface }]}>
            How to get API keys
          </Text>
          <View style={styles.helpItem}>
            <Text style={[styles.helpLabel, { color: colors.primary }]}>
              DeepSeek AI:
            </Text>
            <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
              Visit platform.deepseek.com, create an account, and generate an API key
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Text style={[styles.helpLabel, { color: colors.primary }]}>
              Google Gemini:
            </Text>
            <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
              Visit aistudio.google.com/app/apikey and generate an API key
            </Text>
          </View>
        </GlassCard>

        {/* Sign Out (only for authenticated users) */}
        {user && (
          <GlassCard style={styles.signOutCard}>
            <TouchableOpacity style={styles.signOutItem} onPress={handleSignOut}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.errorContainer }]}>
                  <LogOut size={20} color={colors.error} />
                </View>
                <Text style={[styles.settingTitle, { color: colors.error }]}>
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>

      {/* Custom Modal */}
      <CustomModal
        visible={modalState.visible}
        onClose={hideModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButton={modalState.primaryButton}
        secondaryButton={modalState.secondaryButton}
        dismissible={modalState.dismissible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  signInPrompt: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  signInTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  signInButton: {
    marginTop: spacing.xs,
  },
  settingsCard: {
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  providerCard: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  providerButton: {
    flex: 1,
  },
  apiKeysCard: {
    marginBottom: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  helpCard: {
    marginBottom: spacing.lg,
  },
  helpTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
  },
  helpItem: {
    marginBottom: spacing.sm,
  },
  helpLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  signOutCard: {
    marginBottom: spacing.xl,
  },
  signOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});