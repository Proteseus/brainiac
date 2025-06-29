import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { History, FileText, Calendar, ChevronRight, Search, RefreshCw } from 'lucide-react-native';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { CustomModal } from '@/components/ui/CustomModal';
import { useModal } from '@/hooks/useModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface AnalysisHistory {
  id: string;
  document_title: string;
  ai_provider: 'deepseek' | 'gemini';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  sections_count: number;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { modalState, hideModal, showError } = useModal();
  
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnalysisHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAnalysisHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          id,
          ai_provider,
          status,
          created_at,
          completed_at,
          documents!inner(title),
          analysis_sections(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        document_title: item.documents.title,
        ai_provider: item.ai_provider,
        status: item.status,
        created_at: item.created_at,
        completed_at: item.completed_at,
        sections_count: item.analysis_sections?.length || 0,
      })) || [];

      setAnalyses(formattedData);
    } catch (error) {
      console.error('Error loading analysis history:', error);
      showError(
        'Loading Error',
        'Failed to load your analysis history. Please try again.',
        loadAnalysisHistory
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalysisHistory();
  };

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.document_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.primary;
      case 'processing':
        return colors.tertiary;
      case 'failed':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const viewAnalysisDetails = async (analysisId: string) => {
    try {
      // Load the full analysis details
      const { data, error } = await supabase
        .from('analysis_sections')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at');

      if (error) throw error;

      // For now, just show a modal with the sections count
      // In a full implementation, you'd navigate to a detailed view
      showError(
        'Analysis Details',
        `This analysis contains ${data?.length || 0} sections. Full analysis viewer coming soon!`
      );
    } catch (error) {
      showError(
        'Error',
        'Failed to load analysis details. Please try again.'
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.tertiary + '20', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={[styles.container, styles.centeredContainer]}>
          <GlassCard style={styles.signInPrompt}>
            <History size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.signInTitle, { color: colors.onSurface }]}>
              Sign In Required
            </Text>
            <Text style={[styles.signInText, { color: colors.onSurfaceVariant }]}>
              Sign in to view your analysis history and sync across devices.
            </Text>
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.tertiary + '20', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <History size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Analysis History
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            View your previous document analyses
          </Text>
        </View>

        {/* Search and Refresh */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search analyses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primaryContainer }]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw 
              size={20} 
              color={colors.onPrimaryContainer}
              style={refreshing ? { transform: [{ rotate: '180deg' }] } : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Analysis List */}
        <ScrollView 
          style={styles.analysesList} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {loading ? (
            <GlassCard style={styles.loadingCard}>
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading analysis history...
              </Text>
            </GlassCard>
          ) : filteredAnalyses.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <FileText size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                {searchQuery ? 'No Results Found' : 'No Analyses Yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start by analyzing your first document'
                }
              </Text>
            </GlassCard>
          ) : (
            filteredAnalyses.map((analysis) => (
              <TouchableOpacity 
                key={analysis.id} 
                style={styles.analysisItem}
                onPress={() => viewAnalysisDetails(analysis.id)}
              >
                <GlassCard style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisInfo}>
                      <Text style={[styles.analysisTitle, { color: colors.onSurface }]}>
                        {analysis.document_title}
                      </Text>
                      <View style={styles.analysisMeta}>
                        <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                          {analysis.ai_provider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini'}
                        </Text>
                        <Text style={[styles.metaDot, { color: colors.onSurfaceVariant }]}>
                          •
                        </Text>
                        <Calendar size={12} color={colors.onSurfaceVariant} />
                        <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                          {formatDate(analysis.created_at)}
                        </Text>
                        {analysis.sections_count > 0 && (
                          <>
                            <Text style={[styles.metaDot, { color: colors.onSurfaceVariant }]}>
                              •
                            </Text>
                            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                              {analysis.sections_count} sections
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={styles.analysisActions}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(analysis.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(analysis.status) }
                        ]}>
                          {getStatusText(analysis.status)}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.onSurfaceVariant} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

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
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysesList: {
    flex: 1,
  },
  loadingCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  analysisItem: {
    marginBottom: spacing.md,
  },
  analysisCard: {
    padding: spacing.lg,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  analysisTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  analysisMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  metaDot: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  analysisActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  signInPrompt: {
    alignItems: 'center',
    padding: spacing.xl,
    margin: spacing.md,
  },
  signInTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  signInText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
});