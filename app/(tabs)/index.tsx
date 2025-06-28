import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, FileText, Zap, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, spacing, borderRadius, shadows } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced document analysis using DeepSeek AI and Google Gemini',
    },
    {
      icon: FileText,
      title: 'Multiple Formats',
      description: 'Support for PDF, TXT, and Markdown files',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get comprehensive analysis in seconds',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your documents are processed securely',
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
          <View style={styles.logoContainer}>
            <Brain size={32} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onBackground }]}>
              Brainiac
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            AI-Powered Document Analysis
          </Text>
        </View>

        {/* Quick Actions */}
        <GlassCard style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Quick Actions
          </Text>
          <View style={styles.actionButtons}>
            <Button
              title="Analyze Document"
              onPress={() => router.push('/analyze')}
              size="large"
            />
            {!user && (
              <Button
                title="Sign In"
                onPress={() => router.push('/auth')}
                variant="outlined"
                size="large"
              />
            )}
          </View>
        </GlassCard>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Features
          </Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <GlassCard key={index} style={styles.featureCard}>
                <feature.icon size={24} color={colors.primary} />
                <Text style={[styles.featureTitle, { color: colors.onSurface }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.onSurfaceVariant }]}>
                  {feature.description}
                </Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        {user && (
          <GlassCard style={styles.recentActivity}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Recent Activity
              </Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.emptyState, { color: colors.onSurfaceVariant }]}>
              No recent analyses. Start by analyzing your first document!
            </Text>
          </GlassCard>
        )}

        {/* Welcome Message for Guest Users */}
        {!user && (
          <GlassCard style={styles.welcomeCard}>
            <Text style={[styles.welcomeTitle, { color: colors.onSurface }]}>
              Welcome to Brainiac
            </Text>
            <Text style={[styles.welcomeText, { color: colors.onSurfaceVariant }]}>
              Analyze documents instantly with AI. Sign in to save your analyses and sync across devices.
            </Text>
            <Button
              title="Get Started"
              onPress={() => router.push('/analyze')}
              style={styles.welcomeButton}
            />
          </GlassCard>
        )}
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
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginLeft: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
  },
  actionButtons: {
    gap: spacing.sm,
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    gap: spacing.md,
  },
  featureCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  recentActivity: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAll: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyState: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  welcomeCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  welcomeButton: {
    marginTop: spacing.sm,
  },
});