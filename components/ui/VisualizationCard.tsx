import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, Activity, Eye, Download } from 'lucide-react-native';
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

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return BarChart3;
      case 'graph':
        return TrendingUp;
      case 'pie':
        return PieChart;
      case 'timeline':
        return Activity;
      default:
        return BarChart3;
    }
  };

  const VisualizationIcon = getVisualizationIcon(visualization.type);

  const renderVisualization = () => {
    if (visualization.type === 'chart' && visualization.data.labels && visualization.data.datasets) {
      return (
        <ChartRenderer
          type="bar"
          data={visualization.data}
          height={180}
        />
      );
    }

    if (visualization.type === 'wordcloud') {
      return renderWordCloud();
    }

    if (visualization.type === 'timeline') {
      return renderTimeline();
    }

    if (visualization.type === 'network') {
      return renderNetwork();
    }

    return (
      <View style={[styles.placeholderViz, { backgroundColor: colors.surfaceVariant }]}>
        <VisualizationIcon size={48} color={colors.onSurfaceVariant} />
        <Text style={[styles.placeholderText, { color: colors.onSurfaceVariant }]}>
          {visualization.type.charAt(0).toUpperCase() + visualization.type.slice(1)} Visualization
        </Text>
      </View>
    );
  };

  const renderWordCloud = () => {
    const words = visualization.data.words || [];
    return (
      <View style={styles.wordCloud}>
        {words.slice(0, 20).map((word: any, index: number) => (
          <View
            key={index}
            style={[
              styles.wordItem,
              {
                backgroundColor: colors.primaryContainer,
                opacity: Math.max(0.3, word.frequency || 0.5),
              }
            ]}
          >
            <Text style={[
              styles.wordText,
              {
                color: colors.onPrimaryContainer,
                fontSize: Math.max(10, Math.min(18, (word.frequency || 0.5) * 20)),
              }
            ]}>
              {word.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTimeline = () => {
    const events = visualization.data.events || [];
    return (
      <View style={styles.timeline}>
        {events.slice(0, 5).map((event: any, index: number) => (
          <View key={index} style={styles.timelineItem}>
            <View style={[styles.timelineMarker, { backgroundColor: colors.primary }]} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineDate, { color: colors.primary }]}>
                {event.date}
              </Text>
              <Text style={[styles.timelineText, { color: colors.onSurface }]}>
                {event.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderNetwork = () => {
    const nodes = visualization.data.nodes || [];
    return (
      <View style={styles.network}>
        {nodes.slice(0, 10).map((node: any, index: number) => (
          <View
            key={index}
            style={[
              styles.networkNode,
              {
                backgroundColor: colors.secondaryContainer,
                left: `${Math.random() * 80}%`,
                top: `${Math.random() * 80}%`,
              }
            ]}
          >
            <Text style={[styles.networkNodeText, { color: colors.onSecondaryContainer }]}>
              {node.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <VisualizationIcon size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {visualization.title}
          </Text>
        </View>
        
        <View style={styles.actions}>
          {onExpand && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primaryContainer }]}
              onPress={onExpand}
            >
              <Eye size={16} color={colors.onPrimaryContainer} />
            </TouchableOpacity>
          )}
          {onExport && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondaryContainer }]}
              onPress={onExport}
            >
              <Download size={16} color={colors.onSecondaryContainer} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.visualizationContainer}>
        {renderVisualization()}
      </View>

      <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
        {visualization.description}
      </Text>
    </View>
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
  placeholderViz: {
    height: 180,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
    minHeight: 120,
  },
  wordItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  wordText: {
    fontFamily: 'Inter-Medium',
  },
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
  network: {
    height: 180,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: borderRadius.md,
  },
  networkNode: {
    position: 'absolute',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    maxWidth: 80,
  },
  networkNodeText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});