import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, Activity, Eye, Download, X, Share } from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';
import { ChartRenderer } from './ChartRenderer';
import { VisualizationData } from '@/services/analysisFramework';

interface VisualizationCardProps {
  visualization: VisualizationData;
  onExpand?: () => void;
  onExport?: () => void;
}

export function VisualizationCard({ visualization, onExpand, onExport }: VisualizationCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'chart':
      case 'bar':
        return BarChart3;
      case 'line':
      case 'graph':
        return TrendingUp;
      case 'pie':
      case 'doughnut':
        return PieChart;
      case 'timeline':
      case 'area':
        return Activity;
      default:
        return BarChart3;
    }
  };

  const VisualizationIcon = getVisualizationIcon(visualization.type);

  const handleExpand = () => {
    setIsExpanded(true);
    onExpand?.();
  };

  const handleExport = () => {
    console.log('Exporting visualization:', visualization.title);
    onExport?.();
  };

  const renderVisualization = (expanded = false) => {
    const height = expanded ? 400 : 200;
    
    if ((visualization.type === 'chart' || visualization.type === 'bar') && visualization.data.labels && visualization.data.datasets) {
      return (
        <ChartRenderer
          type="bar"
          data={visualization.data}
          height={height}
          showLegend={expanded}
          onExpand={expanded ? undefined : handleExpand}
          onExport={handleExport}
        />
      );
    }

    if ((visualization.type === 'line' || visualization.type === 'graph') && visualization.data.labels && visualization.data.datasets) {
      return (
        <ChartRenderer
          type="line"
          data={visualization.data}
          height={height}
          showLegend={expanded}
          onExpand={expanded ? undefined : handleExpand}
          onExport={handleExport}
        />
      );
    }

    if ((visualization.type === 'pie' || visualization.type === 'doughnut') && visualization.data.labels && visualization.data.datasets) {
      return (
        <ChartRenderer
          type={visualization.type as 'pie' | 'doughnut'}
          data={visualization.data}
          height={height}
          showLegend={expanded}
          onExpand={expanded ? undefined : handleExpand}
          onExport={handleExport}
        />
      );
    }

    if (visualization.type === 'wordcloud') {
      return renderWordCloud(expanded);
    }

    if (visualization.type === 'timeline') {
      return renderTimeline(expanded);
    }

    if (visualization.type === 'network') {
      return renderNetwork(expanded);
    }

    return renderPlaceholder(expanded);
  };

  const renderWordCloud = (expanded = false) => {
    const words = visualization.data.words || [];
    const maxWords = expanded ? 50 : 20;
    
    return (
      <View style={[styles.wordCloud, { minHeight: expanded ? 300 : 150 }]}>
        {words.slice(0, maxWords).map((word: any, index: number) => {
          const frequency = word.frequency || Math.random();
          const fontSize = expanded 
            ? Math.max(12, Math.min(24, frequency * 30))
            : Math.max(10, Math.min(18, frequency * 20));
          
          return (
            <View
              key={index}
              style={[
                styles.wordItem,
                {
                  backgroundColor: colors.primaryContainer,
                  opacity: Math.max(0.4, frequency),
                }
              ]}
            >
              <Text style={[
                styles.wordText,
                {
                  color: colors.onPrimaryContainer,
                  fontSize,
                }
              ]}>
                {word.text}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTimeline = (expanded = false) => {
    const events = visualization.data.events || [];
    const maxEvents = expanded ? events.length : 5;
    
    return (
      <View style={[styles.timeline, { maxHeight: expanded ? 400 : 200 }]}>
        {events.slice(0, maxEvents).map((event: any, index: number) => (
          <View key={index} style={styles.timelineItem}>
            <View style={[styles.timelineMarker, { backgroundColor: colors.primary }]} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineDate, { color: colors.primary }]}>
                {event.date}
              </Text>
              <Text style={[styles.timelineText, { color: colors.onSurface }]}>
                {event.description}
              </Text>
              {expanded && event.details && (
                <Text style={[styles.timelineDetails, { color: colors.onSurfaceVariant }]}>
                  {event.details}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderNetwork = (expanded = false) => {
    const nodes = visualization.data.nodes || [];
    const maxNodes = expanded ? 20 : 10;
    
    return (
      <View style={[styles.network, { height: expanded ? 300 : 180 }]}>
        {nodes.slice(0, maxNodes).map((node: any, index: number) => {
          const size = expanded ? 60 : 40;
          return (
            <View
              key={index}
              style={[
                styles.networkNode,
                {
                  backgroundColor: colors.secondaryContainer,
                  left: `${Math.random() * 70 + 10}%`,
                  top: `${Math.random() * 70 + 10}%`,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                }
              ]}
            >
              <Text style={[
                styles.networkNodeText, 
                { 
                  color: colors.onSecondaryContainer,
                  fontSize: expanded ? 10 : 8,
                }
              ]}>
                {node.label}
              </Text>
            </View>
          );
        })}
        
        {/* Connection lines */}
        {expanded && nodes.length > 1 && (
          <View style={styles.networkConnections}>
            {Array.from({ length: Math.min(5, nodes.length - 1) }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.connectionLine,
                  {
                    backgroundColor: colors.outline,
                    left: `${Math.random() * 60 + 20}%`,
                    top: `${Math.random() * 60 + 20}%`,
                    width: Math.random() * 100 + 50,
                    transform: [{ rotate: `${Math.random() * 360}deg` }],
                  }
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPlaceholder = (expanded = false) => (
    <View style={[
      styles.placeholderViz, 
      { 
        backgroundColor: colors.surfaceVariant,
        height: expanded ? 300 : 180,
      }
    ]}>
      <VisualizationIcon size={expanded ? 64 : 48} color={colors.onSurfaceVariant} />
      <Text style={[styles.placeholderText, { color: colors.onSurfaceVariant }]}>
        {visualization.type.charAt(0).toUpperCase() + visualization.type.slice(1)} Visualization
      </Text>
      {expanded && (
        <Text style={[styles.placeholderSubtext, { color: colors.onSurfaceVariant }]}>
          Advanced visualization rendering coming soon
        </Text>
      )}
    </View>
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <VisualizationIcon size={20} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onSurface }]}>
              {visualization.title}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primaryContainer }]}
              onPress={handleExpand}
            >
              <Eye size={16} color={colors.onPrimaryContainer} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondaryContainer }]}
              onPress={handleExport}
            >
              <Download size={16} color={colors.onSecondaryContainer} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.visualizationContainer}>
          {renderVisualization(false)}
        </View>

        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          {visualization.description}
        </Text>
      </View>

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
            <View style={styles.modalTitleSection}>
              <VisualizationIcon size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {visualization.title}
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: colors.secondaryContainer }]}
                onPress={handleExport}
              >
                <Share size={18} color={colors.onSecondaryContainer} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setIsExpanded(false)}
              >
                <X size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalContent}>
            {renderVisualization(true)}
            
            <View style={styles.modalDescription}>
              <Text style={[styles.modalDescriptionText, { color: colors.onSurfaceVariant }]}>
                {visualization.description}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizationContainer: {
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  
  // Visualization Styles
  placeholderViz: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  placeholderSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  
  // Word Cloud
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  wordItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  wordText: {
    fontFamily: 'Inter-Medium',
  },
  
  // Timeline
  timeline: {
    padding: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
  },
  timelineText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  timelineDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  
  // Network
  network: {
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  networkNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  networkNodeText: {
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  networkConnections: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  connectionLine: {
    position: 'absolute',
    height: 1,
    opacity: 0.3,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalDescription: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  modalDescriptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
});