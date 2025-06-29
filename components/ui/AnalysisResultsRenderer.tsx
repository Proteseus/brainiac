import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Copy, Share, Download } from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';
import { AnalysisResult } from '@/services/analysisFramework';
import { MarkdownRenderer } from './MarkdownRenderer';
import { VisualizationCard } from './VisualizationCard';
import { GlassCard } from './GlassCard';

interface AnalysisResultsRendererProps {
  result: AnalysisResult;
  onExport?: () => void;
  onShare?: () => void;
}

export function AnalysisResultsRenderer({ result, onExport, onShare }: AnalysisResultsRendererProps) {
  const { colors } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive_summary']));

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (content: string) => {
    // In a real app, implement clipboard functionality
    console.log('Copy to clipboard:', content);
  };

  const renderSection = (sectionKey: string, section: any) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <GlassCard key={sectionKey} style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
        >
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {section.title}
            </Text>
            <View style={styles.sectionMeta}>
              <Text style={[styles.wordCount, { color: colors.onSurfaceVariant }]}>
                {section.word_count} words
              </Text>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: colors.primaryContainer }
              ]}>
                <Text style={[styles.confidenceText, { color: colors.onPrimaryContainer }]}>
                  {Math.round(section.confidence * 100)}%
                </Text>
              </View>
            </View>
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
            
            {section.key_points && section.key_points.length > 0 && (
              <View style={styles.keyPointsContainer}>
                <Text style={[styles.keyPointsTitle, { color: colors.onSurface }]}>
                  Key Points:
                </Text>
                {section.key_points.map((point: string, index: number) => (
                  <View key={index} style={styles.keyPointItem}>
                    <View style={[styles.keyPointBullet, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.keyPointText, { color: colors.onSurfaceVariant }]}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {section.citations && section.citations.length > 0 && (
              <View style={styles.citationsContainer}>
                <Text style={[styles.citationsTitle, { color: colors.onSurface }]}>
                  Citations:
                </Text>
                {section.citations.map((citation: string, index: number) => (
                  <Text key={index} style={[styles.citationText, { color: colors.onSurfaceVariant }]}>
                    [{index + 1}] {citation}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </GlassCard>
    );
  };

  const renderSentimentAnalysis = () => {
    if (!result.sentiment_analysis) return null;

    const sentiment = result.sentiment_analysis;
    
    return (
      <GlassCard style={styles.sentimentCard}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Sentiment Analysis
        </Text>
        
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
    if (!result.key_entities || result.key_entities.length === 0) return null;

    const entitiesByType = result.key_entities.reduce((acc, entity) => {
      if (!acc[entity.type]) acc[entity.type] = [];
      acc[entity.type].push(entity);
      return acc;
    }, {} as { [key: string]: any[] });

    return (
      <GlassCard style={styles.entitiesCard}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Key Entities
        </Text>
        
        {Object.entries(entitiesByType).map(([type, entities]) => (
          <View key={type} style={styles.entityTypeSection}>
            <Text style={[styles.entityTypeTitle, { color: colors.onSurface }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s:
            </Text>
            <View style={styles.entityGrid}>
              {entities.slice(0, 10).map((entity, index) => (
                <View key={index} style={[styles.entityItem, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.entityText, { color: colors.onSurface }]}>
                    {entity.text}
                  </Text>
                  <Text style={[styles.entityConfidence, { color: colors.onSurfaceVariant }]}>
                    {Math.round(entity.confidence * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </GlassCard>
    );
  };

  const renderVisualizations = () => {
    if (!result.visualizations || result.visualizations.length === 0) return null;

    return (
      <View style={styles.visualizationsSection}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Data Visualizations
        </Text>
        {result.visualizations.map((viz, index) => (
          <VisualizationCard
            key={index}
            visualization={viz}
            onExpand={() => console.log('Expand visualization')}
            onExport={() => console.log('Export visualization')}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Results Header */}
      <GlassCard style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerMain}>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              Analysis Results
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {result.word_count} words • {Math.round(result.processing_time / 1000)}s processing time
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            {onShare && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.primaryContainer }]}
                onPress={onShare}
              >
                <Share size={16} color={colors.onPrimaryContainer} />
              </TouchableOpacity>
            )}
            {onExport && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.secondaryContainer }]}
                onPress={onExport}
              >
                <Download size={16} color={colors.onSecondaryContainer} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.onSurfaceVariant }]}>
              Template:
            </Text>
            <Text style={[styles.metadataValue, { color: colors.onSurface }]}>
              {result.configuration.template.name}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: colors.onSurfaceVariant }]}>
              Confidence:
            </Text>
            <Text style={[styles.metadataValue, { color: colors.primary }]}>
              {Math.round(result.confidence_score * 100)}%
            </Text>
          </View>
          
          {result.readability_score && (
            <View style={styles.metadataItem}>
              <Text style={[styles.metadataLabel, { color: colors.onSurfaceVariant }]}>
                Readability:
              </Text>
              <Text style={[styles.metadataValue, { color: colors.onSurface }]}>
                {Math.round(result.readability_score)}
              </Text>
            </View>
          )}
        </View>
      </GlassCard>

      {/* Analysis Sections */}
      {Object.entries(result.sections).map(([key, section]) => 
        renderSection(key, section)
      )}

      {/* Sentiment Analysis */}
      {renderSentimentAnalysis()}

      {/* Key Entities */}
      {renderEntities()}

      {/* Visualizations */}
      {renderVisualizations()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerMain: {
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
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: spacing.xs,
  },
  metadataValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  sectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
  sectionActions: {
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
  sectionContent: {
    paddingTop: spacing.md,
  },
  keyPointsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  keyPointsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  keyPointBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginRight: spacing.sm,
  },
  keyPointText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    flex: 1,
  },
  citationsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  citationsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  citationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
    marginBottom: spacing.xs,
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
  entityTypeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
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
  },
  entityText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  entityConfidence: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  visualizationsSection: {
    marginBottom: spacing.xl,
  },
});