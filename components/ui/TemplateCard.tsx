import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Target, ChartBar as BarChart3, FileText, Briefcase, GraduationCap, Scale, Wrench, DollarSign } from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';
import { AnalysisTemplate } from '@/services/analysisFramework';

interface TemplateCardProps {
  template: AnalysisTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const { colors } = useTheme();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business':
        return Briefcase;
      case 'academic':
        return GraduationCap;
      case 'legal':
        return Scale;
      case 'technical':
        return Wrench;
      case 'financial':
        return DollarSign;
      default:
        return FileText;
    }
  };

  const CategoryIcon = getCategoryIcon(template.category);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
          borderColor: isSelected ? colors.primary : colors.outlineVariant,
        }
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <CategoryIcon 
            size={20} 
            color={isSelected ? colors.onPrimaryContainer : colors.primary} 
          />
        </View>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: colors.secondaryContainer }
        ]}>
          <Text style={[styles.categoryText, { color: colors.onSecondaryContainer }]}>
            {template.category}
          </Text>
        </View>
      </View>

      <Text style={[
        styles.title,
        { color: isSelected ? colors.onPrimaryContainer : colors.onSurface }
      ]}>
        {template.name}
      </Text>

      <Text style={[
        styles.description,
        { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant }
      ]}>
        {template.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.timeEstimate}>
          <Clock size={14} color={colors.onSurfaceVariant} />
          <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
            ~{Math.round(template.estimatedTime / 60)}min
          </Text>
        </View>
        
        <View style={styles.features}>
          <Target size={12} color={colors.onSurfaceVariant} />
          <BarChart3 size={12} color={colors.onSurfaceVariant} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    padding: spacing.lg,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
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
  features: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});