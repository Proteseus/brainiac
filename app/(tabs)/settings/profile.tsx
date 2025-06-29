import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, ArrowLeft, CreditCard as Edit3, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName || null,
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      await loadProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '20', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <User size={32} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onBackground }]}>
              Profile
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Manage your account information
            </Text>
          </View>
        </View>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                {user?.email?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditing(!editing)}
            >
              {editing ? (
                <Save size={20} color={colors.primary} />
              ) : (
                <Edit3 size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setEditing(false);
                    setFullName(profile?.full_name || '');
                  }}
                  variant="outlined"
                  style={styles.cancelButton}
                />
                <Button
                  title="Save Changes"
                  onPress={saveProfile}
                  loading={loading}
                  style={styles.saveButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                  Full Name
                </Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                  {profile?.full_name || user?.user_metadata?.full_name || 'Not set'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                  Email Address
                </Text>
                <View style={styles.emailContainer}>
                  <Mail size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                    {user?.email}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                  Member Since
                </Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                  {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                  Last Updated
                </Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                  {profile?.updated_at ? formatDate(profile.updated_at) : 'Never'}
                </Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Account Stats */}
        <GlassCard style={styles.statsCard}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Account Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                0
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Documents Analyzed
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                0
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Total Analyses
              </Text>
            </View>
          </View>
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
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
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
  profileCard: {
    marginBottom: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: spacing.sm,
  },
  editForm: {
    gap: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  profileInfo: {
    gap: spacing.lg,
  },
  infoItem: {
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statsCard: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});