import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brain, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';

interface AnalysisProgressProps {
  progress: number;
  message: string;
  stage: string;
  isComplete?: boolean;
  hasError?: boolean;
}

export function AnalysisProgress({ 
  progress, 
  message, 
  stage, 
  isComplete = false, 
  hasError = false 
}: AnalysisProgressProps) {
  const { colors } = useTheme();

  const getStageIcon = () => {
    if (hasError) return AlertCircle;
    if (isComplete) return CheckCircle;
    return Brain;
  };

  const getStageColor = () => {
    if (hasError) return colors.error;
    if (isComplete) return colors.primary;
    return colors.primary;
  };

  const StageIcon = getStageIcon();
  const stageColor = getStageColor();

  const stages = [
    { key: 'init', label: 'Initializing' },
    { key: 'preprocessing', label: 'Preprocessing' },
    { key: 'metadata', label: 'Metadata' },
    { key: 'structure', label: 'Structure' },
    { key: 'ai_analysis', label: 'AI Analysis' },
    { key: 'entities', label: 'Entities' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'visualizations', label: 'Visualizations' },
    { key: 'compilation', label: 'Compilation' },
    { key: 'complete', label: 'Complete' },
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <StageIcon size={24} color={stageColor} />
        <Text style={[styles.title, { color: colors.onSurface }]}>
          {isComplete ? 'Analysis Complete' : hasError ? 'Analysis Failed' : 'Analyzing Document'}
        </Text>
      </View>

      <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
        {message}
      </Text>

      {!hasError && (
        <>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: stageColor,
                  width: `${progress}%`,
                }
              ]} 
            />
          </View>

          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
              {Math.round(progress)}% Complete
            </Text>
            <View style={styles.timeEstimate}>
              <Clock size={12} color={colors.onSurfaceVariant} />
              <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                {progress > 0 ? `~${Math.round((100 - progress) * 2)}s remaining` : 'Estimating...'}
              </Text>
            </View>
          </View>

          <View style={styles.stagesContainer}>
            <Text style={[styles.stagesTitle, { color: colors.onSurface }]}>
              Analysis Stages
            </Text>
            <View style={styles.stagesList}>
              {stages.map((stageItem, index) => (
                <View 
                  key={stageItem.key}
                  style={[
                    styles.stageItem,
                    {
                      backgroundColor: index <= currentStageIndex 
                        ? colors.primaryContainer 
                        : colors.surfaceVariant,
                    }
                  ]}
                >
                  <Text style={[
                    styles.stageText,
                    {
                      color: index <= currentStageIndex 
                        ? colors.onPrimaryContainer 
                        : colors.onSurfaceVariant,
                    }
                  ]}>
                    {stageItem.label}
                  </Text>
                  {index === currentStageIndex && (
                    <View style={[styles.currentIndicator, { backgroundColor: stageColor }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
  stagesContainer: {
    marginTop: spacing.md,
  },
  stagesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  stagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  stageItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    position: 'relative',
  },
  stageText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
  },
  currentIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});