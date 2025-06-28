import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, LogOut, Key, Brain, Mail } from 'lucide-react-native';
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

export default function ProfileScreen() {
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

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.primary + '20', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={[styles.container, styles.centeredContainer]}>
          <GlassCard style={styles.signInPrompt}>
            <User size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.signInTitle, { color: colors.onSurface }]}>
              Welcome to Brainiac
            </Text>
            <Text style={[styles.signInText, { color: colors.onSurfaceVariant }]}>
              Sign in to access your profile, save API keys, and sync your analyses across devices.
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
          <User size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Profile
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Manage your account and preferences
          </Text>
        </View>

        {/* User Info */}
        <GlassCard style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                {user.email?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.onSurface }]}>
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </Text>
              <View style={styles.emailContainer}>
                <Mail size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>
                  {user.email}
                </Text>
              </View>
            </View>
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

        {/* Settings */}
        <GlassCard style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <Settings size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Preferences
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: colors.onSurface }]}>
              Preferred AI Provider
            </Text>
            <Text style={[styles.settingValue, { color: colors.onSurfaceVariant }]}>
              {settings?.preferred_ai_provider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini'}
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: colors.onSurface }]}>
              Theme
            </Text>
            <Text style={[styles.settingValue, { color: colors.onSurfaceVariant }]}>
              {settings?.theme_preference === 'system' ? 'System' : 
               settings?.theme_preference === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>
        </GlassCard>

        {/* Sign Out */}
        <GlassCard style={styles.signOutCard}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outlined"
            style={[styles.signOutButton, { borderColor: colors.error }]}
          />
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
  userCard: {
    marginBottom: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userEmail: {
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
  settingsCard: {
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  signOutCard: {
    marginBottom: spacing.xl,
  },
  signOutButton: {
    borderWidth: 1,
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