import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Upload, 
  FileText, 
  Settings, 
  Brain, 
  Zap, 
  Target, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  analysisFramework, 
  AnalysisTemplate, 
  AnalysisConfiguration, 
  AnalysisResult,
  DocumentMetadata 
} from '@/services/analysisFramework';

interface Document {
  id: string;
  title: string;
  content: string;
  fileType: 'pdf' | 'txt' | 'md' | 'docx' | 'csv' | 'json';
  fileSize: number;
}

interface AnalysisProgress {
  progress: number;
  message: string;
  stage: string;
}

const LOCAL_STORAGE_KEYS = {
  DEEPSEEK_API_KEY: 'deepseek_api_key',
  GEMINI_API_KEY: 'gemini_api_key',
  PREFERRED_AI_PROVIDER: 'preferred_ai_provider',
};

export default function AnalyzeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AnalysisTemplate | null>(null);
  const [analysisConfig, setAnalysisConfig] = useState<Partial<AnalysisConfiguration>>({
    depth: 'standard',
    focus: [],
    outputLanguage: 'en',
    includeVisualization: true,
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'deepseek' | 'gemini'>('deepseek');
  const [apiKeys, setApiKeys] = useState({
    deepseek: '',
    gemini: '',
  });

  useEffect(() => {
    loadSettings();
    // Set default template
    const templates = analysisFramework.getTemplates();
    if (templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setSelectedProvider(data.preferred_ai_provider || 'deepseek');
          setApiKeys({
            deepseek: data.deepseek_api_key || '',
            gemini: data.gemini_api_key || '',
          });
        }
      } else {
        const [deepseek, gemini, provider] = await Promise.all([
          AsyncStorage.getItem(LOCAL_STORAGE_KEYS.DEEPSEEK_API_KEY),
          AsyncStorage.getItem(LOCAL_STORAGE_KEYS.GEMINI_API_KEY),
          AsyncStorage.getItem(LOCAL_STORAGE_KEYS.PREFERRED_AI_PROVIDER),
        ]);

        setApiKeys({
          deepseek: deepseek || '',
          gemini: gemini || '',
        });
        setSelectedProvider((provider as 'deepseek' | 'gemini') || 'deepseek');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'application/pdf', 'text/csv', 'application/json'],
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
                   asset.mimeType?.includes('markdown') ? 'md' :
                   asset.mimeType?.includes('csv') ? 'csv' :
                   asset.mimeType?.includes('json') ? 'json' : 'txt',
          fileSize: asset.size || 0,
        };

        setDocument(doc);
        setAnalysisResult(null);
        setAnalysisProgress(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const startAnalysis = async () => {
    if (!document || !selectedTemplate) return;

    const apiKey = apiKeys[selectedProvider] || 
      (selectedProvider === 'deepseek' 
        ? process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY
        : process.env.EXPO_PUBLIC_GEMINI_API_KEY);

    if (!apiKey) {
      Alert.alert(
        'API Key Required',
        `Please configure your ${selectedProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'} API key in the settings.`,
        [
          { text: 'Go to Settings', onPress: () => router.push('/settings') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({ progress: 0, message: 'Starting analysis...', stage: 'init' });

    try {
      const metadata: DocumentMetadata = {
        title: document.title,
        fileType: document.fileType,
        fileSize: document.fileSize,
        wordCount: 0,
        createdAt: new Date(),
      };

      const configuration: AnalysisConfiguration = {
        template: selectedTemplate,
        depth: analysisConfig.depth || 'standard',
        focus: analysisConfig.focus || [],
        excludeTopics: analysisConfig.excludeTopics,
        outputLanguage: analysisConfig.outputLanguage || 'en',
        includeVisualization: analysisConfig.includeVisualization || false,
      };

      const result = await analysisFramework.analyzeDocument(
        document.content,
        metadata,
        configuration,
        apiKey,
        selectedProvider,
        (progress) => {
          setAnalysisProgress(progress);
        }
      );

      setAnalysisResult(result);

      // Save to database if user is logged in
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
            user_id: user.id,
            document_id: result.documentId,
            ai_provider: selectedProvider,
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
          });
      }

    } catch (error) {
      Alert.alert('Error', `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAnalysisProgress({ progress: 0, message: 'Analysis failed', stage: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const templates = analysisFramework.getTemplates();
  const hasApiKey = apiKeys[selectedProvider] || 
    (selectedProvider === 'deepseek' 
      ? process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY
      : process.env.EXPO_PUBLIC_GEMINI_API_KEY);

  const renderTemplateSelector = () => (
    <GlassCard style={styles.templateCard}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        Analysis Template
      </Text>
      <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
        Choose the type of analysis that best fits your document
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateItem,
              {
                backgroundColor: selectedTemplate?.id === template.id 
                  ? colors.primaryContainer 
                  : colors.surfaceVariant,
                borderColor: selectedTemplate?.id === template.id 
                  ? colors.primary 
                  : colors.outline,
              }
            ]}
            onPress={() => setSelectedTemplate(template)}
          >
            <View style={styles.templateHeader}>
              <Text style={[
                styles.templateName,
                { 
                  color: selectedTemplate?.id === template.id 
                    ? colors.onPrimaryContainer 
                    : colors.onSurface 
                }
              ]}>
                {template.name}
              </Text>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: colors.secondary + '20' }
              ]}>
                <Text style={[styles.categoryText, { color: colors.secondary }]}>
                  {template.category}
                </Text>
              </View>
            </View>
            <Text style={[
              styles.templateDescription,
              { 
                color: selectedTemplate?.id === template.id 
                  ? colors.onPrimaryContainer 
                  : colors.onSurfaceVariant 
              }
            ]}>
              {template.description}
            </Text>
            <View style={styles.templateFooter}>
              <View style={styles.timeEstimate}>
                <Clock size={14} color={colors.onSurfaceVariant} />
                <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                  ~{Math.round(template.estimatedTime / 60)}min
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </GlassCard>
  );

  const renderAnalysisConfig = () => (
    <GlassCard style={styles.configCard}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        Analysis Configuration
      </Text>
      
      {/* Analysis Depth */}
      <View style={styles.configSection}>
        <Text style={[styles.configLabel, { color: colors.onSurfaceVariant }]}>
          Analysis Depth
        </Text>
        <View style={styles.depthButtons}>
          {(['quick', 'standard', 'comprehensive', 'expert'] as const).map((depth) => (
            <TouchableOpacity
              key={depth}
              style={[
                styles.depthButton,
                {
                  backgroundColor: analysisConfig.depth === depth 
                    ? colors.primary 
                    : colors.surfaceVariant,
                }
              ]}
              onPress={() => setAnalysisConfig(prev => ({ ...prev, depth }))}
            >
              <Text style={[
                styles.depthButtonText,
                { 
                  color: analysisConfig.depth === depth 
                    ? colors.onPrimary 
                    : colors.onSurfaceVariant 
                }
              ]}>
                {depth.charAt(0).toUpperCase() + depth.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Visualization Toggle */}
      <View style={styles.configSection}>
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setAnalysisConfig(prev => ({ 
            ...prev, 
            includeVisualization: !prev.includeVisualization 
          }))}
        >
          <View style={styles.toggleLeft}>
            <BarChart3 size={20} color={colors.primary} />
            <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>
              Include Visualizations
            </Text>
          </View>
          <View style={[
            styles.toggle,
            { 
              backgroundColor: analysisConfig.includeVisualization 
                ? colors.primary 
                : colors.outline 
            }
          ]}>
            <View style={[
              styles.toggleThumb,
              {
                backgroundColor: colors.surface,
                transform: [{ 
                  translateX: analysisConfig.includeVisualization ? 20 : 2 
                }],
              }
            ]} />
          </View>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderAnalysisProgress = () => {
    if (!analysisProgress) return null;

    return (
      <GlassCard style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Brain size={24} color={colors.primary} />
          <Text style={[styles.progressTitle, { color: colors.onSurface }]}>
            Analyzing Document
          </Text>
        </View>
        
        <Text style={[styles.progressMessage, { color: colors.onSurfaceVariant }]}>
          {analysisProgress.message}
        </Text>
        
        <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary,
                width: `${analysisProgress.progress}%`,
              }
            ]} 
          />
        </View>
        
        <Text style={[styles.progressPercent, { color: colors.onSurfaceVariant }]}>
          {Math.round(analysisProgress.progress)}% Complete
        </Text>
        
        <View style={styles.stageIndicator}>
          <Text style={[styles.stageText, { color: colors.onSurfaceVariant }]}>
            Stage: {analysisProgress.stage.replace('_', ' ')}
          </Text>
        </View>
      </GlassCard>
    );
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    return (
      <View style={styles.resultsContainer}>
        {/* Results Header */}
        <GlassCard style={styles.resultsHeader}>
          <View style={styles.resultsHeaderContent}>
            <CheckCircle size={32} color={colors.primary} />
            <View style={styles.resultsHeaderText}>
              <Text style={[styles.resultsTitle, { color: colors.onSurface }]}>
                Analysis Complete
              </Text>
              <Text style={[styles.resultsSubtitle, { color: colors.onSurfaceVariant }]}>
                {analysisResult.word_count} words analyzed in {Math.round(analysisResult.processing_time / 1000)}s
              </Text>
            </View>
            <View style={styles.confidenceScore}>
              <Text style={[styles.confidenceLabel, { color: colors.onSurfaceVariant }]}>
                Confidence
              </Text>
              <Text style={[styles.confidenceValue, { color: colors.primary }]}>
                {Math.round(analysisResult.confidence_score * 100)}%
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Analysis Sections */}
        {Object.entries(analysisResult.sections).map(([key, section]) => (
          <GlassCard key={key} style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.onSurfaceVariant }]}>
              {section.content}
            </Text>
            {section.key_points && section.key_points.length > 0 && (
              <View style={styles.keyPoints}>
                <Text style={[styles.keyPointsTitle, { color: colors.onSurface }]}>
                  Key Points:
                </Text>
                {section.key_points.map((point, index) => (
                  <Text key={index} style={[styles.keyPoint, { color: colors.onSurfaceVariant }]}>
                    • {point}
                  </Text>
                ))}
              </View>
            )}
          </GlassCard>
        ))}

        {/* Sentiment Analysis */}
        {analysisResult.sentiment_analysis && (
          <GlassCard style={styles.sentimentCard}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Sentiment Analysis
            </Text>
            <View style={styles.sentimentContent}>
              <View style={styles.sentimentOverall}>
                <Text style={[styles.sentimentLabel, { color: colors.onSurface }]}>
                  Overall Sentiment:
                </Text>
                <Text style={[
                  styles.sentimentValue,
                  { 
                    color: analysisResult.sentiment_analysis.overall_sentiment === 'positive' 
                      ? colors.primary 
                      : analysisResult.sentiment_analysis.overall_sentiment === 'negative'
                      ? colors.error
                      : colors.onSurfaceVariant
                  }
                ]}>
                  {analysisResult.sentiment_analysis.overall_sentiment.toUpperCase()}
                </Text>
              </View>
              <View style={styles.sentimentDistribution}>
                <View style={styles.sentimentBar}>
                  <View 
                    style={[
                      styles.sentimentSegment,
                      { 
                        backgroundColor: colors.primary,
                        flex: analysisResult.sentiment_analysis.sentiment_distribution.positive,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.sentimentSegment,
                      { 
                        backgroundColor: colors.surfaceVariant,
                        flex: analysisResult.sentiment_analysis.sentiment_distribution.neutral,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.sentimentSegment,
                      { 
                        backgroundColor: colors.error,
                        flex: analysisResult.sentiment_analysis.sentiment_distribution.negative,
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Key Entities */}
        {analysisResult.key_entities && analysisResult.key_entities.length > 0 && (
          <GlassCard style={styles.entitiesCard}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Key Entities
            </Text>
            <View style={styles.entitiesGrid}>
              {analysisResult.key_entities.slice(0, 10).map((entity, index) => (
                <View key={index} style={[styles.entityItem, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.entityText, { color: colors.onSurface }]}>
                    {entity.text}
                  </Text>
                  <Text style={[styles.entityType, { color: colors.onSurfaceVariant }]}>
                    {entity.type}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}
      </View>
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
          <Brain size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Advanced Document Analysis
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Comprehensive AI-powered document insights
          </Text>
        </View>

        {/* API Key Warning */}
        {!hasApiKey && (
          <GlassCard style={styles.warningCard}>
            <AlertCircle size={24} color={colors.tertiary} />
            <Text style={[styles.warningTitle, { color: colors.onSurface }]}>
              API Key Required
            </Text>
            <Text style={[styles.warningText, { color: colors.onSurfaceVariant }]}>
              Configure your {selectedProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'} API key in settings to start analyzing documents.
            </Text>
            <Button
              title="Go to Settings"
              onPress={() => router.push('/settings')}
              variant="outlined"
              style={styles.warningButton}
            />
          </GlassCard>
        )}

        {/* Document Upload */}
        <GlassCard style={styles.uploadCard}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Select Document
          </Text>
          
          {!document ? (
            <View style={styles.uploadArea}>
              <Upload size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.uploadText, { color: colors.onSurfaceVariant }]}>
                Upload PDF, TXT, Markdown, CSV, or JSON files
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

        {/* Template Selection */}
        {document && renderTemplateSelector()}

        {/* Analysis Configuration */}
        {document && selectedTemplate && renderAnalysisConfig()}

        {/* AI Provider Selection */}
        {document && selectedTemplate && (
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
        {document && selectedTemplate && !isAnalyzing && !analysisResult && hasApiKey && (
          <GlassCard style={styles.analyzeCard}>
            <Target size={32} color={colors.primary} />
            <Text style={[styles.analyzeTitle, { color: colors.onSurface }]}>
              Ready to Analyze
            </Text>
            <Text style={[styles.analyzeDescription, { color: colors.onSurfaceVariant }]}>
              Start comprehensive AI analysis using {selectedTemplate.name} template with {selectedProvider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini'}
            </Text>
            <Button
              title="Start Advanced Analysis"
              onPress={startAnalysis}
              size="large"
              style={styles.analyzeButton}
            />
          </GlassCard>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && renderAnalysisProgress()}

        {/* Analysis Results */}
        {analysisResult && renderAnalysisResults()}
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  warningCard: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  warningButton: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
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
  templateCard: {
    marginBottom: spacing.lg,
  },
  templateScroll: {
    marginTop: spacing.sm,
  },
  templateItem: {
    width: 280,
    padding: spacing.md,
    marginRight: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  templateName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  templateDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  configCard: {
    marginBottom: spacing.lg,
  },
  configSection: {
    marginBottom: spacing.lg,
  },
  configLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: spacing.sm,
  },
  depthButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  depthButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  depthButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  progressMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: spacing.md,
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
  progressPercent: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stageIndicator: {
    alignItems: 'center',
  },
  stageText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
  },
  resultsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  resultsHeader: {
    padding: spacing.lg,
  },
  resultsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultsHeaderText: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  resultsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  confidenceScore: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  confidenceValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  sectionCard: {
    padding: spacing.lg,
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  keyPoints: {
    marginTop: spacing.sm,
  },
  keyPointsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  keyPoint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  sentimentCard: {
    padding: spacing.lg,
  },
  sentimentContent: {
    gap: spacing.md,
  },
  sentimentOverall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sentimentValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  sentimentDistribution: {
    marginTop: spacing.sm,
  },
  sentimentBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sentimentSegment: {
    height: '100%',
  },
  entitiesCard: {
    padding: spacing.lg,
  },
  entitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  entityItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  entityText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  entityType: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
  },
});