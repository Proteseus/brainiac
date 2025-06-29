import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, User, Key, Brain, Palette, Bell, ChevronRight, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface UserSettings {
  preferred_ai_provider: 'deepseek' | 'gemini';
  theme_preference: 'light' | 'dark' | 'system';
  deepseek_api_key: string | null;
  gemini_api_key: string | null;
  notifications_enabled: boolean;
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepseekKey, setDeepseekKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    if (user) {
      loadUserSettings();
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
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveApiKeys = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          deepseek_api_key: deepseekKey || null,
          gemini_api_key: geminiKey || null,
        });

      if (error) throw error;

      Alert.alert('Success', 'API keys saved successfully');
      await loadUserSettings();
    } catch (error) {
      Alert.alert('Error', 'Failed to save API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const settingsItems = [
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
  ];

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.primary + '20', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={[styles.container, styles.centeredContainer]}>
          <GlassCard style={styles.signInPrompt}>
            <Settings size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.signInTitle, { color: colors.onSurface }]}>
              Welcome to Brainiac
            </Text>
            <Text style={[styles.signInText, { color: colors.onSurfaceVariant }]}>
              Sign in to access settings, save API keys, and sync your analyses across devices.
            </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/auth')}
              style={styles.signInButton}
            />
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

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
            Manage your account and preferences
          </Text>
        </View>

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
          </Text>
          
          <Input
            label="DeepSeek API Key"
            placeholder="Enter your DeepSeek API key"
            value={deepseekKey}
            onChangeText={setDeepseekKey}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <Input
            label="Google Gemini API Key"
            placeholder="Enter your Gemini API key"
            value={geminiKey}
            onChangeText={setGeminiKey}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <Button
            title="Save API Keys"
            onPress={saveApiKeys}
            loading={loading}
            style={styles.saveButton}
          />
        </GlassCard>

        {/* Sign Out */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  apiKeysCard: {
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
  saveButton: {
    marginTop: spacing.sm,
  },
  signOutCard: {
    marginBottom: spacing.xl,
  },
  signOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signInPrompt: {
    alignItems: 'center',
    padding: spacing.xl,
    margin: spacing.md,
  },
  signInTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  signInText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  signInButton: {
    marginTop: spacing.sm,
  },
});