import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Upload, FileText, Settings, Brain } from 'lucide-react-native';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { aiService } from '@/services/aiService';

interface Document {
  id: string;
  title: string;
  content: string;
  fileType: 'pdf' | 'txt' | 'md';
  fileSize: number;
}

interface Analysis {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  sections?: {
    summary: string;
    insights: string;
    recommendations: string;
    technical: string;
    fullReport: string;
  };
}

export default function AnalyzeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'deepseek' | 'gemini'>('deepseek');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const content = await FileSystem.readAsStringAsync(asset.uri);
        
        const doc: Document = {
          id: Math.random().toString(36).substr(2, 9),
          title: asset.name,
          content,
          fileType: asset.mimeType?.includes('pdf') ? 'pdf' : 
                   asset.mimeType?.includes('markdown') ? 'md' : 'txt',
          fileSize: asset.size || 0,
        };

        setDocument(doc);
        setAnalysis(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const startAnalysis = async () => {
    if (!document) return;

    // Get API key from environment or user settings
    let apiKey = selectedProvider === 'deepseek' 
      ? process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY
      : process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      Alert.alert(
        'API Key Required',
        `Please configure your ${selectedProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'} API key in the settings.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const analysisId = Math.random().toString(36).substr(2, 9);
      
      setAnalysis({
        id: analysisId,
        status: 'processing',
        progress: 0,
      });

      // Save document to database if user is logged in
      if (user) {
        await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            title: document.title,
            content: document.content,
            file_type: document.fileType,
            file_size: document.fileSize,
          });

        await supabase
          .from('analyses')
          .insert({
            id: analysisId,
            user_id: user.id,
            document_id: document.id,
            ai_provider: selectedProvider,
            status: 'processing',
          });
      }

      // Perform AI analysis
      const result = await aiService.analyzeDocument(
        {
          content: document.content,
          provider: selectedProvider,
          apiKey,
        },
        (progress) => {
          setAnalysis(prev => prev ? {
            ...prev,
            progress: progress.progress,
          } : null);
        }
      );

      // Update analysis with results
      setAnalysis(prev => prev ? {
        ...prev,
        status: 'completed',
        progress: 100,
        sections: result,
      } : null);

      // Save analysis sections to database if user is logged in
      if (user) {
        const sections = [
          { section_type: 'summary', title: 'Executive Summary', content: result.summary },
          { section_type: 'insights', title: 'Key Insights', content: result.insights },
          { section_type: 'recommendations', title: 'Recommendations', content: result.recommendations },
          { section_type: 'technical', title: 'Technical Details', content: result.technical },
          { section_type: 'full_report', title: 'Full Report', content: result.fullReport },
        ];

        await supabase
          .from('analysis_sections')
          .insert(sections.map(section => ({
            analysis_id: analysisId,
            ...section,
          })));

        await supabase
          .from('analyses')
          .update({ 
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
          })
          .eq('id', analysisId);
      }

    } catch (error) {
      setAnalysis(prev => prev ? {
        ...prev,
        status: 'failed',
        progress: 0,
      } : null);
      
      Alert.alert('Error', 'Analysis failed. Please try again.');
    }
  };

  const renderAnalysisResults = () => {
    if (!analysis?.sections) return null;

    return (
      <GlassCard style={styles.resultsCard}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Analysis Results
        </Text>
        
        <View style={styles.resultSection}>
          <Text style={[styles.resultTitle, { color: colors.primary }]}>
            Executive Summary
          </Text>
          <Text style={[styles.resultContent, { color: colors.onSurfaceVariant }]}>
            {analysis.sections.summary}
          </Text>
        </View>

        <View style={styles.resultSection}>
          <Text style={[styles.resultTitle, { color: colors.primary }]}>
            Key Insights
          </Text>
          <Text style={[styles.resultContent, { color: colors.onSurfaceVariant }]}>
            {analysis.sections.insights}
          </Text>
        </View>

        <View style={styles.resultSection}>
          <Text style={[styles.resultTitle, { color: colors.primary }]}>
            Recommendations
          </Text>
          <Text style={[styles.resultContent, { color: colors.onSurfaceVariant }]}>
            {analysis.sections.recommendations}
          </Text>
        </View>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.secondary + '20', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <FileText size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Document Analysis
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Upload and analyze your documents with AI
          </Text>
        </View>

        {/* Document Upload */}
        <GlassCard style={styles.uploadCard}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Select Document
          </Text>
          
          {!document ? (
            <View style={styles.uploadArea}>
              <Upload size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.uploadText, { color: colors.onSurfaceVariant }]}>
                Upload PDF, TXT, or Markdown files
              </Text>
              <Button
                title="Choose File"
                onPress={pickDocument}
                style={styles.uploadButton}
              />
            </View>
          ) : (
            <View style={styles.documentInfo}>
              <FileText size={24} color={colors.primary} />
              <View style={styles.documentDetails}>
                <Text style={[styles.documentTitle, { color: colors.onSurface }]}>
                  {document.title}
                </Text>
                <Text style={[styles.documentMeta, { color: colors.onSurfaceVariant }]}>
                  {document.fileType.toUpperCase()} • {(document.fileSize / 1024).toFixed(1)} KB
                </Text>
              </View>
              <Button
                title="Change"
                onPress={pickDocument}
                variant="outlined"
                size="small"
              />
            </View>
          )}
        </GlassCard>

        {/* AI Provider Selection */}
        {document && (
          <GlassCard style={styles.providerCard}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              AI Provider
            </Text>
            <View style={styles.providerButtons}>
              <Button
                title="DeepSeek AI"
                onPress={() => setSelectedProvider('deepseek')}
                variant={selectedProvider === 'deepseek' ? 'filled' : 'outlined'}
                style={styles.providerButton}
              />
              <Button
                title="Google Gemini"
                onPress={() => setSelectedProvider('gemini')}
                variant={selectedProvider === 'gemini' ? 'filled' : 'outlined'}
                style={styles.providerButton}
              />
            </View>
          </GlassCard>
        )}

        {/* Analysis Button */}
        {document && !analysis && (
          <GlassCard style={styles.analyzeCard}>
            <Brain size={32} color={colors.primary} />
            <Text style={[styles.analyzeTitle, { color: colors.onSurface }]}>
              Ready to Analyze
            </Text>
            <Text style={[styles.analyzeDescription, { color: colors.onSurfaceVariant }]}>
              Start AI analysis of your document with {selectedProvider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini'}
            </Text>
            <Button
              title="Start Analysis"
              onPress={startAnalysis}
              size="large"
              style={styles.analyzeButton}
            />
          </GlassCard>
        )}

        {/* Analysis Progress */}
        {analysis && analysis.status === 'processing' && (
          <GlassCard style={styles.progressCard}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Analyzing Document
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${analysis.progress}%`,
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
              {analysis.progress}% Complete
            </Text>
          </GlassCard>
        )}

        {/* Analysis Results */}
        {analysis?.status === 'completed' && renderAnalysisResults()}

        {/* Analysis Failed */}
        {analysis?.status === 'failed' && (
          <GlassCard style={styles.errorCard}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>
              Analysis Failed
            </Text>
            <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
              Something went wrong during the analysis. Please check your API key and try again.
            </Text>
            <Button
              title="Try Again"
              onPress={startAnalysis}
              variant="outlined"
              style={styles.retryButton}
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
  },
  uploadCard: {
    marginBottom: spacing.lg,
  },
  uploadArea: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  uploadText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  uploadButton: {
    marginTop: spacing.sm,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  documentMeta: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: spacing.xs,
  },
  providerCard: {
    marginBottom: spacing.lg,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  providerButton: {
    flex: 1,
  },
  analyzeCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  analyzeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  analyzeDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  analyzeButton: {
    marginTop: spacing.sm,
  },
  progressCard: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  resultsCard: {
    marginBottom: spacing.lg,
  },
  resultSection: {
    marginBottom: spacing.lg,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  resultContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  errorCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
});