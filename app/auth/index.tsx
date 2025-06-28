import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Mail, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export default function AuthScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const handleAuth = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;
        
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email for verification.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    });
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '30', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Brain size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onBackground }]}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {isSignUp 
              ? 'Join Brainiac to save and sync your analyses'
              : 'Sign in to access your saved analyses'
            }
          </Text>
        </View>

        {/* Auth Form */}
        <GlassCard style={styles.authCard}>
          {isSignUp && (
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              autoCapitalize="words"
            />
          )}
          
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
            autoCapitalize="none"
          />
          
          {isSignUp && (
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
              autoCapitalize="none"
            />
          )}
          
          <Button
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleAuth}
            loading={loading}
            size="large"
            style={styles.authButton}
          />
        </GlassCard>

        {/* Auth Mode Toggle */}
        <GlassCard style={styles.toggleCard}>
          <Text style={[styles.toggleText, { color: colors.onSurfaceVariant }]}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={[styles.toggleLink, { color: colors.primary }]}>
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Features */}
        <GlassCard style={styles.featuresCard}>
          <Text style={[styles.featuresTitle, { color: colors.onSurface }]}>
            Why create an account?
          </Text>
          
          <View style={styles.featureItem}>
            <Mail size={20} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Save and sync your analyses across devices
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Lock size={20} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Secure API key storage and management
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Brain size={20} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
              Access to analysis history and insights
            </Text>
          </View>
        </GlassCard>

        {/* Skip Option */}
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => router.back()}
        >
          <Text style={[styles.skipText, { color: colors.onSurfaceVariant }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 24,
  },
  authCard: {
    marginBottom: spacing.lg,
  },
  authButton: {
    marginTop: spacing.md,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  toggleLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  featuresCard: {
    marginBottom: spacing.lg,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 20,
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});