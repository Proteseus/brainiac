import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  Eye, 
  EyeOff, 
  Clock, 
  Brain, 
  FileText, 
  TrendingUp,
  Target,
  Lightbulb,
  Settings,
  BarChart3,
  Heart,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ChartRenderer } from '@/components/ui/ChartRenderer';
import { CustomModal } from '@/components/ui/CustomModal';
import { useModal } from '@/hooks/useModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface AnalysisData {
  id: string;
  document_title: string;
  ai_provider: 'deepseek' | 'gemini';
  status: string;
  created_at: string;
  completed_at: string | null;
  sections: AnalysisSection[];
  document: {
    title: string;
    file_type: string;
    file_size: number;
    content: string;
  };
}

interface AnalysisSection {
  id: string;
  section_type: 'summary' | 'insights' | 'recommendations' | 'technical' | 'full_report';
  title: string;
  content: string;
  created_at: string;
}

interface EntityData {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'percentage' | 'other';
  confidence: number;
  context: string;
}

interface SentimentData {
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  emotional_tone: string[];
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export default function AnalysisViewerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { modalState, hideModal, showError, showSuccess } = useModal();
  
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [showDocumentContent, setShowDocumentContent] = useState(false);
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);

  useEffect(() => {
    if (id) {
      loadAnalysis();
    }
  }, [id]);

  const loadAnalysis = async () => {
    if (!user || !id) return;
    
    try {
      setLoading(true);
      
      // Load analysis with sections and document
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          id,
          ai_provider,
          status,
          created_at,
          completed_at,
          documents!inner(
            title,
            file_type,
            file_size,
            content
          ),
          analysis_sections(
            id,
            section_type,
            title,
            content,
            created_at
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const analysisData: AnalysisData = {
          id: data.id,
          document_title: data.documents.title,
          ai_provider: data.ai_provider,
          status: data.status,
          created_at: data.created_at,
          completed_at: data.completed_at,
          sections: data.analysis_sections || [],
          document: data.documents,
        };
        
        setAnalysis(analysisData);
        
        // Extract entities and sentiment from content
        if (data.documents.content) {
          extractEntitiesFromContent(data.documents.content);
          analyzeSentimentFromContent(data.documents.content);
        }
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      showError(
        'Loading Error',
        'Failed to load the analysis. Please try again.',
        () => router.back()
      );
    } finally {
      setLoading(false);
    }
  };

  const extractEntitiesFromContent = (content: string) => {
    const extractedEntities: EntityData[] = [];
    
    // Extract dates
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const dates = content.match(dateRegex) || [];
    dates.slice(0, 10).forEach(date => {
      extractedEntities.push({
        text: date,
        type: 'date',
        confidence: 0.8,
        context: getContext(content, date),
      });
    });
    
    // Extract percentages
    const percentageRegex = /\b\d+(?:\.\d+)?%\b/g;
    const percentages = content.match(percentageRegex) || [];
    percentages.slice(0, 10).forEach(percentage => {
      extractedEntities.push({
        text: percentage,
        type: 'percentage',
        confidence: 0.9,
        context: getContext(content, percentage),
      });
    });
    
    // Extract money amounts
    const moneyRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
    const amounts = content.match(moneyRegex) || [];
    amounts.slice(0, 10).forEach(amount => {
      extractedEntities.push({
        text: amount,
        type: 'money',
        confidence: 0.9,
        context: getContext(content, amount),
      });
    });
    
    setEntities(extractedEntities);
  };

  const analyzeSentimentFromContent = (content: string) => {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'benefit', 'advantage', 'improve', 'growth', 'opportunity'];
    const negativeWords = ['bad', 'poor', 'negative', 'problem', 'issue', 'risk', 'disadvantage', 'decline', 'loss', 'concern'];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    const positiveRatio = total > 0 ? positiveCount / total : 0.33;
    const negativeRatio = total > 0 ? negativeCount / total : 0.33;
    const neutralRatio = 1 - positiveRatio - negativeRatio;
    
    let overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
    if (positiveRatio > 0.6) overallSentiment = 'positive';
    else if (negativeRatio > 0.6) overallSentiment = 'negative';
    else if (positiveRatio > 0.3 && negativeRatio > 0.3) overallSentiment = 'mixed';
    
    setSentiment({
      overall_sentiment: overallSentiment,
      confidence: Math.max(positiveRatio, negativeRatio, neutralRatio),
      emotional_tone: overallSentiment === 'positive' ? ['optimistic', 'confident'] : 
                     overallSentiment === 'negative' ? ['concerned', 'cautious'] : ['neutral', 'balanced'],
      sentiment_distribution: {
        positive: positiveRatio,
        negative: negativeRatio,
        neutral: neutralRatio,
      },
    });
  };

  const getContext = (content: string, entity: string): string => {
    const index = content.indexOf(entity);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + entity.length + 50);
    return content.substring(start, end);
  };

  const toggleSection = (sectionType: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionType)) {
      newExpanded.delete(sectionType);
    } else {
      newExpanded.add(sectionType);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'summary': return FileText;
      case 'insights': return Lightbulb;
      case 'recommendations': return Target;
      case 'technical': return Settings;
      case 'full_report': return Brain;
      default: return FileText;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'person': return Users;
      case 'organization': return Users;
      case 'location': return MapPin;
      case 'date': return Calendar;
      case 'money': return DollarSign;
      case 'percentage': return Percent;
      default: return Info;
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        showSuccess('Copied', 'Content copied to clipboard');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Copied', 'Content copied to clipboard');
      }
    } catch (error) {
      showError('Copy Failed', 'Failed to copy content to clipboard');
    }
  };

  const shareAnalysis = async () => {
    if (!analysis) return;
    
    try {
      const shareContent = `Analysis: ${analysis.document_title}\n\nGenerated on ${new Date(analysis.created_at).toLocaleDateString()}\n\nSummary:\n${analysis.sections.find(s => s.section_type === 'summary')?.content || 'No summary available'}`;
      
      if (Share.share) {
        await Share.share({
          message: shareContent,
          title: `Analysis: ${analysis.document_title}`,
        });
      } else {
        await copyToClipboard(shareContent);
      }
    } catch (error) {
      showError('Share Failed', 'Failed to share the analysis');
    }
  };

  const exportAnalysis = async () => {
    if (!analysis) return;
    
    try {
      let exportContent = `# Analysis Report: ${analysis.document_title}\n\n`;
      exportContent += `**Generated:** ${new Date(analysis.created_at).toLocaleDateString()}\n`;
      exportContent += `**AI Provider:** ${analysis.ai_provider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini'}\n`;
      exportContent += `**Document Type:** ${analysis.document.file_type.toUpperCase()}\n\n`;
      
      analysis.sections.forEach(section => {
        exportContent += `## ${section.title}\n\n${section.content}\n\n`;
      });
      
      // Create and download file
      const blob = new Blob([exportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysis.document_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Export Complete', 'Analysis exported successfully');
    } catch (error) {
      showError('Export Failed', 'Failed to export the analysis');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSentimentAnalysis = () => {
    if (!sentiment) return null;

    return (
      <GlassCard style={styles.sentimentCard}>
        <View style={styles.sectionHeader}>
          <Heart size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Sentiment Analysis
          </Text>
        </View>
        
        <View style={styles.sentimentOverview}>
          <View style={styles.sentimentMain}>
            <Text style={[styles.sentimentLabel, { color: colors.onSurface }]}>
              Overall Sentiment:
            </Text>
            <Text style={[
              styles.sentimentValue,
              { 
                color: sentiment.overall_sentiment === 'positive' 
                  ? colors.primary 
                  : sentiment.overall_sentiment === 'negative'
                  ? colors.error
                  : colors.onSurfaceVariant
              }
            ]}>
              {sentiment.overall_sentiment.toUpperCase()}
            </Text>
          </View>
          
          <View style={[styles.confidenceBadge, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.confidenceText, { color: colors.onPrimaryContainer }]}>
              {Math.round(sentiment.confidence * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.sentimentDistribution}>
          <Text style={[styles.distributionTitle, { color: colors.onSurface }]}>
            Sentiment Distribution:
          </Text>
          
          <View style={styles.sentimentBar}>
            <View 
              style={[
                styles.sentimentSegment,
                { 
                  backgroundColor: colors.primary,
                  flex: sentiment.sentiment_distribution.positive,
                }
              ]} 
            />
            <View 
              style={[
                styles.sentimentSegment,
                { 
                  backgroundColor: colors.surfaceVariant,
                  flex: sentiment.sentiment_distribution.neutral,
                }
              ]} 
            />
            <View 
              style={[
                styles.sentimentSegment,
                { 
                  backgroundColor: colors.error,
                  flex: sentiment.sentiment_distribution.negative,
                }
              ]} 
            />
          </View>
          
          <View style={styles.sentimentLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.onSurface }]}>
                Positive ({Math.round(sentiment.sentiment_distribution.positive * 100)}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.surfaceVariant }]} />
              <Text style={[styles.legendText, { color: colors.onSurface }]}>
                Neutral ({Math.round(sentiment.sentiment_distribution.neutral * 100)}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
              <Text style={[styles.legendText, { color: colors.onSurface }]}>
                Negative ({Math.round(sentiment.sentiment_distribution.negative * 100)}%)
              </Text>
            </View>
          </View>
        </View>

        {sentiment.emotional_tone && sentiment.emotional_tone.length > 0 && (
          <View style={styles.emotionalTone}>
            <Text style={[styles.toneTitle, { color: colors.onSurface }]}>
              Emotional Tone:
            </Text>
            <View style={styles.toneList}>
              {sentiment.emotional_tone.map((tone, index) => (
                <View key={index} style={[styles.toneTag, { backgroundColor: colors.secondaryContainer }]}>
                  <Text style={[styles.toneText, { color: colors.onSecondaryContainer }]}>
                    {tone}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </GlassCard>
    );
  };

  const renderEntities = () => {
    if (entities.length === 0) return null;

    const entitiesByType = entities.reduce((acc, entity) => {
      if (!acc[entity.type]) acc[entity.type] = [];
      acc[entity.type].push(entity);
      return acc;
    }, {} as { [key: string]: EntityData[] });

    return (
      <GlassCard style={styles.entitiesCard}>
        <View style={styles.sectionHeader}>
          <Users size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Key Entities
          </Text>
        </View>
        
        {Object.entries(entitiesByType).map(([type, typeEntities]) => {
          const EntityIcon = getEntityIcon(type);
          return (
            <View key={type} style={styles.entityTypeSection}>
              <View style={styles.entityTypeHeader}>
                <EntityIcon size={16} color={colors.primary} />
                <Text style={[styles.entityTypeTitle, { color: colors.onSurface }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}s ({typeEntities.length})
                </Text>
              </View>
              <View style={styles.entityGrid}>
                {typeEntities.slice(0, 8).map((entity, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.entityItem, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => copyToClipboard(entity.text)}
                  >
                    <Text style={[styles.entityText, { color: colors.onSurface }]}>
                      {entity.text}
                    </Text>
                    <Text style={[styles.entityConfidence, { color: colors.onSurfaceVariant }]}>
                      {Math.round(entity.confidence * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </GlassCard>
    );
  };

  const renderVisualization = () => {
    if (!sentiment) return null;

    const chartData = {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        label: 'Sentiment Distribution',
        data: [
          Math.round(sentiment.sentiment_distribution.positive * 100),
          Math.round(sentiment.sentiment_distribution.neutral * 100),
          Math.round(sentiment.sentiment_distribution.negative * 100),
        ],
        backgroundColor: [colors.primary, colors.surfaceVariant, colors.error],
      }],
    };

    return (
      <GlassCard style={styles.visualizationCard}>
        <View style={styles.sectionHeader}>
          <BarChart3 size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Data Visualization
          </Text>
        </View>
        
        <ChartRenderer
          type="doughnut"
          data={chartData}
          title="Sentiment Distribution"
          height={250}
          showLegend={true}
        />
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.primary + '20', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.container, styles.centeredContainer]}>
          <Brain size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurface }]}>
            Loading analysis...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analysis) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.error + '20', colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.container, styles.centeredContainer]}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>
            Analysis Not Found
          </Text>
          <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
            The requested analysis could not be found or you don't have permission to view it.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
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
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              Analysis Report
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {analysis.document_title}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.primaryContainer }]}
              onPress={shareAnalysis}
            >
              <Share2 size={20} color={colors.onPrimaryContainer} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.secondaryContainer }]}
              onPress={exportAnalysis}
            >
              <Download size={20} color={colors.onSecondaryContainer} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analysis Overview */}
        <GlassCard style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Brain size={32} color={colors.primary} />
            <View style={styles.overviewContent}>
              <Text style={[styles.overviewTitle, { color: colors.onSurface }]}>
                Analysis Overview
              </Text>
              <Text style={[styles.overviewSubtitle, { color: colors.onSurfaceVariant }]}>
                Generated using {analysis.ai_provider === 'deepseek' ? 'DeepSeek AI' : 'Google Gemini'}
              </Text>
            </View>
          </View>
          
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Clock size={16} color={colors.onSurfaceVariant} />
              <Text style={[styles.metadataLabel, { color: colors.onSurfaceVariant }]}>
                Created
              </Text>
              <Text style={[styles.metadataValue, { color: colors.onSurface }]}>
                {formatDate(analysis.created_at)}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <FileText size={16} color={colors.onSurfaceVariant} />
              <Text style={[styles.metadataLabel, { color: colors.onSurfaceVariant }]}>
                Document Type
              </Text>
              <Text style={[styles.metadataValue, { color: colors.onSurface }]}>
                {analysis.document.file_type.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <TrendingUp size={16} color={colors.onSurfaceVariant} />
              <Text style={[styles.metadataLabel, { color: colors.onSurfaceVariant }]}>
                Sections
              </Text>
              <Text style={[styles.metadataValue, { color: colors.onSurface }]}>
                {analysis.sections.length}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <CheckCircle size={16} color={colors.primary} />
              <Text style={[styles.metadataLabel, { color: colors.onSurfaceVariant }]}>
                Status
              </Text>
              <Text style={[styles.metadataValue, { color: colors.primary }]}>
                {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Document Content Toggle */}
        <GlassCard style={styles.documentCard}>
          <TouchableOpacity
            style={styles.documentHeader}
            onPress={() => setShowDocumentContent(!showDocumentContent)}
          >
            <View style={styles.documentTitleSection}>
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.documentTitle, { color: colors.onSurface }]}>
                Original Document
              </Text>
            </View>
            <View style={styles.documentActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => copyToClipboard(analysis.document.content)}
              >
                <Copy size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              {showDocumentContent ? (
                <EyeOff size={20} color={colors.onSurfaceVariant} />
              ) : (
                <Eye size={20} color={colors.onSurfaceVariant} />
              )}
            </View>
          </TouchableOpacity>
          
          {showDocumentContent && (
            <View style={styles.documentContent}>
              <ScrollView 
                style={styles.documentScrollView}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.documentText, { color: colors.onSurfaceVariant }]}>
                  {analysis.document.content}
                </Text>
              </ScrollView>
            </View>
          )}
        </GlassCard>

        {/* Analysis Sections */}
        {analysis.sections.map((section) => {
          const SectionIcon = getSectionIcon(section.section_type);
          const isExpanded = expandedSections.has(section.section_type);
          
          return (
            <GlassCard key={section.id} style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeaderButton}
                onPress={() => toggleSection(section.section_type)}
              >
                <View style={styles.sectionTitleSection}>
                  <SectionIcon size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    {section.title}
                  </Text>
                </View>
                
                <View style={styles.sectionActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => copyToClipboard(section.content)}
                  >
                    <Copy size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.onSurfaceVariant} />
                  ) : (
                    <ChevronDown size={20} color={colors.onSurfaceVariant} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.sectionContent}>
                  <MarkdownRenderer content={section.content} />
                </View>
              )}
            </GlassCard>
          );
        })}

        {/* Sentiment Analysis */}
        {renderSentimentAnalysis()}

        {/* Key Entities */}
        {renderEntities()}

        {/* Data Visualization */}
        {renderVisualization()}
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
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
  overviewCard: {
    marginBottom: spacing.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  overviewContent: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  overviewSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metadataItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  metadataValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  documentCard: {
    marginBottom: spacing.lg,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  documentTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentContent: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  documentScrollView: {
    maxHeight: 200,
  },
  documentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeaderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionContent: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sentimentCard: {
    marginBottom: spacing.md,
  },
  sentimentOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sentimentMain: {
    flex: 1,
  },
  sentimentLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: spacing.xs,
  },
  sentimentValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  sentimentDistribution: {
    marginBottom: spacing.md,
  },
  distributionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  sentimentBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  sentimentSegment: {
    height: '100%',
  },
  sentimentLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  emotionalTone: {
    marginTop: spacing.md,
  },
  toneTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  toneList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toneTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  toneText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  entitiesCard: {
    marginBottom: spacing.md,
  },
  entityTypeSection: {
    marginBottom: spacing.md,
  },
  entityTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  entityTypeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  entityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  entityItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  entityText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  entityConfidence: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  visualizationCard: {
    marginBottom: spacing.xl,
  },
});