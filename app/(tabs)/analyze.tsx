import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Upload, FileText, Settings, Brain, Zap, Target, ChartBar as BarChart3, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTheme, spacing } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AnalysisProgress } from '@/components/ui/AnalysisProgress';
import { AnalysisResultsRenderer } from '@/components/ui/AnalysisResultsRenderer';
import { CustomModal } from '@/components/ui/CustomModal';
import { useModal } from '@/hooks/useModal';
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

interface AnalysisProgressState {
  progress: number;
  message: string;
  stage: string;
}

const LOCAL_STORAGE_KEYS = {
  DEEPSEEK_API_KEY: 'deepseek_api_key',
  GEMINI_API_KEY: 'gemini_api_key',
  PREFERRED_AI_PROVIDER: 'preferred_ai_provider',
};

// Comprehensive content sanitization function
const sanitizeDocumentContent = (content: string): string => {
  if (!content) return '';
  
  try {
    return content
      // Remove null bytes and problematic control characters
      .replace(/\u0000/g, '')
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
      // Handle Unicode escape sequences
      .replace(/\\u0000/g, '')
      .replace(/\\u([0-9A-Fa-f]{4})/g, (match, hex) => {
        const codePoint = parseInt(hex, 16);
        // Skip problematic characters
        if (codePoint === 0 || (codePoint >= 1 && codePoint <= 31) || (codePoint >= 127 && codePoint <= 159)) {
          return '';
        }
        try {
          return String.fromCharCode(codePoint);
        } catch {
          return '';
        }
      })
      // Remove other problematic sequences
      .replace(/\x00/g, '')
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('Error sanitizing content:', error);
    // Fallback: remove all non-printable characters
    return content.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '').trim();
  }
};

const sanitizeTitle = (title: string): string => {
  if (!title) return 'Untitled Document';
  
  const sanitized = sanitizeDocumentContent(title)
    .substring(0, 255)
    .trim();
    
  return sanitized || 'Untitled Document';
};

export default function AnalyzeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AnalysisTemplate | null>(null);
  const [analysisConfig, setAnalysisConfig] = useState<Partial<AnalysisConfiguration>>({
    depth: 'standard',
    focus: [],
    outputLanguage: 'en',
    includeVisualization: true,
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgressState | null>(null);
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
      showError(
        'Settings Error',
        'Failed to load your settings. Please try again.',
        loadSettings
      );
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
        let content = '';
        
        try {
          content = await FileSystem.readAsStringAsync(asset.uri);
        } catch (error) {
          console.error('Error reading file:', error);
          showError(
            'File Error',
            'Failed to read the selected file. Please try a different file.',
            pickDocument
          );
          return;
        }

        // Sanitize content immediately after reading
        const sanitizedContent = sanitizeDocumentContent(content);
        const sanitizedTitle = sanitizeTitle(asset.name);
        
        if (!sanitizedContent.trim()) {
          showError(
            'Invalid Document',
            'The selected document appears to be empty or contains only invalid characters. Please try a different document.'
          );
          return;
        }
        
        const doc: Document = {
          id: Math.random().toString(36).substr(2, 9),
          title: sanitizedTitle,
          content: sanitizedContent,
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
      console.error('Document picker error:', error);
      showError(
        'Document Error',
        'Failed to load the selected document. Please try again.',
        pickDocument
      );
    }
  };

  const saveAnalysisToDatabase = async (result: AnalysisResult, documentId: string) => {
    if (!user) return; // Only save for authenticated users

    try {
      // Save the analysis record
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          document_id: documentId,
          ai_provider: selectedProvider,
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Save each analysis section with sanitized content
      const sectionsToSave = Object.entries(result.sections).map(([sectionType, section]) => ({
        analysis_id: analysisData.id,
        section_type: sectionType as 'summary' | 'insights' | 'recommendations' | 'technical' | 'full_report',
        title: sanitizeTitle(section.title),
        content: sanitizeDocumentContent(section.content),
      }));

      const { error: sectionsError } = await supabase
        .from('analysis_sections')
        .insert(sectionsToSave);

      if (sectionsError) throw sectionsError;

      console.log('Analysis saved successfully to database');
    } catch (error) {
      console.error('Error saving analysis to database:', error);
      // Don't throw error to avoid breaking the analysis flow
      showError(
        'Save Warning',
        'Analysis completed successfully but could not be saved to your history. The results are still available for viewing.'
      );
    }
  };

  const startAnalysis = async () => {
    if (!document || !selectedTemplate) return;

    const apiKey = apiKeys[selectedProvider] || 
      (selectedProvider === 'deepseek' 
        ? process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY
        : process.env.EXPO_PUBLIC_GEMINI_API_KEY);

    if (!apiKey) {
      showError(
        'API Key Required',
        `Please configure your ${selectedProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'} API key in the settings.`,
        () => router.push('/settings')
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({ progress: 0, message: 'Starting analysis...', stage: 'init' });

    try {
      // First, save the document to database if user is authenticated
      let savedDocumentId = document.id;
      
      if (user) {
        setAnalysisProgress({ progress: 5, message: 'Saving document...', stage: 'init' });
        
        // Double-check content sanitization before saving
        const finalContent = sanitizeDocumentContent(document.content);
        const finalTitle = sanitizeTitle(document.title);
        
        if (!finalContent.trim()) {
          throw new Error('Document content is invalid after sanitization');
        }
        
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            title: finalTitle,
            content: finalContent,
            file_type: document.fileType,
            file_size: document.fileSize,
          })
          .select()
          .single();

        if (documentError) {
          console.error('Error saving document:', documentError);
          // Continue with analysis even if document save fails
        } else {
          savedDocumentId = documentData.id;
        }
      }

      const metadata: DocumentMetadata = {
        title: sanitizeTitle(document.title),
        fileType: document.fileType,
        fileSize: document.fileSize,
        wordCount: document.content.trim().split(/\s+/).length,
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

      // Save analysis to database
      if (user) {
        setAnalysisProgress({ progress: 98, message: 'Saving analysis...', stage: 'saving' });
        await saveAnalysisToDatabase(result, savedDocumentId);
      }

      setAnalysisProgress({ progress: 100, message: 'Analysis complete!', stage: 'complete' });

      showSuccess(
        'Analysis Complete',
        'Your document has been analyzed successfully. You can now view the detailed results below.'
      );

    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showError(
        'Analysis Failed',
        `Analysis failed: ${errorMessage}. Please check your API key and try again.`,
        startAnalysis
      );
      
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

  // If we have analysis results, show them
  if (analysisResult) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.secondary + '20', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.container}>
          <View style={styles.resultsHeader}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.primaryContainer }]}
              onPress={() => {
                setAnalysisResult(null);
                setAnalysisProgress(null);
              }}
            >
              <Text style={[styles.backButtonText, { color: colors.onPrimaryContainer }]}>
                ← New Analysis
              </Text>
            </TouchableOpacity>
          </View>
          
          <AnalysisResultsRenderer
            result={analysisResult}
            onExport={() => console.log('Export analysis')}
            onShare={() => console.log('Share analysis')}
          />
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
            Comprehensive AI-powered document insights with rich visualizations
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
              <Text style={[styles.uploadSubtext, { color: colors.onSurfaceVariant }]}>
                Advanced parsing supports tables, charts, and structured data
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
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
                  Rich markdown formatting
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
                  Interactive visualizations
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
                  Sentiment & entity analysis
                </Text>
              </View>
              {user && (
                <View style={styles.featureItem}>
                  <CheckCircle size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
                    Saved to your analysis history
                  </Text>
                </View>
              )}
            </View>
            <Button
              title="Start Advanced Analysis"
              onPress={startAnalysis}
              size="large"
              style={styles.analyzeButton}
            />
          </GlassCard>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && analysisProgress && (
          <AnalysisProgress
            progress={analysisProgress.progress}
            message={analysisProgress.message}
            stage={analysisProgress.stage}
            isComplete={analysisProgress.progress === 100}
            hasError={analysisProgress.stage === 'error'}
          />
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 24,
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: spacing.lg,
    opacity: 0.8,
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
  featuresList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  analyzeButton: {
    marginTop: spacing.sm,
  },
  resultsHeader: {
    marginBottom: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});