import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, BarChart3, PieChart, Activity, Download, Maximize2 } from 'lucide-react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

interface ChartRendererProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  data: ChartData;
  title?: string;
  height?: number;
  showLegend?: boolean;
  animated?: boolean;
  onExpand?: () => void;
  onExport?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function ChartRenderer({ 
  type, 
  data, 
  title, 
  height = 220, 
  showLegend = true,
  animated = true,
  onExpand,
  onExport
}: ChartRendererProps) {
  const { colors } = useTheme();

  const getChartIcon = () => {
    switch (type) {
      case 'bar': return BarChart3;
      case 'line': return TrendingUp;
      case 'area': return Activity;
      case 'pie':
      case 'doughnut': return PieChart;
      default: return BarChart3;
    }
  };

  const ChartIcon = getChartIcon();

  const generateColors = (count: number) => {
    const baseColors = [
      colors.primary,
      colors.secondary,
      colors.tertiary,
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
    ];
    
    return Array.from({ length: count }, (_, i) => 
      baseColors[i % baseColors.length]
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...data.datasets[0].data);
    const minValue = Math.min(...data.datasets[0].data);
    const range = maxValue - minValue;
    const chartWidth = Math.max(screenWidth - 80, data.labels.length * 60);
    const chartColors = generateColors(data.datasets[0].data.length);
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.barChart, { width: chartWidth, height: height - 60 }]}>
          {/* Y-Axis */}
          <View style={styles.yAxis}>
            {[...Array(5)].map((_, index) => {
              const value = Math.round(minValue + (range * (4 - index)) / 4);
              return (
                <Text key={index} style={[styles.yAxisLabel, { color: colors.onSurfaceVariant }]}>
                  {value.toLocaleString()}
                </Text>
              );
            })}
          </View>
          
          <View style={styles.chartArea}>
            {/* Grid Lines */}
            <View style={styles.gridLines}>
              {[...Array(5)].map((_, index) => (
                <View 
                  key={index} 
                  style={[styles.gridLine, { borderTopColor: colors.outline + '40' }]} 
                />
              ))}
            </View>
            
            {/* Bars */}
            <View style={styles.barsContainer}>
              {data.datasets[0].data.map((value, index) => {
                const barHeight = range > 0 ? ((value - minValue) / range) * (height - 120) : 0;
                return (
                  <View key={index} style={styles.barWrapper}>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: Math.max(barHeight, 2),
                            backgroundColor: chartColors[index],
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.barValue, { color: colors.onSurface }]}>
                      {value.toLocaleString()}
                    </Text>
                    <Text style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                      {data.labels[index]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...data.datasets[0].data);
    const minValue = Math.min(...data.datasets[0].data);
    const range = maxValue - minValue || 1;
    const chartWidth = Math.max(screenWidth - 80, data.labels.length * 80);
    const chartHeight = height - 100;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.lineChart, { width: chartWidth, height: height - 60 }]}>
          {/* Y-Axis */}
          <View style={styles.yAxis}>
            {[...Array(5)].map((_, index) => {
              const value = Math.round(minValue + (range * (4 - index)) / 4);
              return (
                <Text key={index} style={[styles.yAxisLabel, { color: colors.onSurfaceVariant }]}>
                  {value.toLocaleString()}
                </Text>
              );
            })}
          </View>
          
          <View style={styles.chartArea}>
            {/* Grid Lines */}
            <View style={styles.gridLines}>
              {[...Array(5)].map((_, index) => (
                <View 
                  key={index} 
                  style={[styles.gridLine, { borderTopColor: colors.outline + '40' }]} 
                />
              ))}
            </View>
            
            {/* Line and Points */}
            <View style={styles.lineContainer}>
              {data.datasets[0].data.map((value, index) => {
                const pointY = ((maxValue - value) / range) * chartHeight;
                const pointX = (index / Math.max(data.datasets[0].data.length - 1, 1)) * (chartWidth - 80);
                
                return (
                  <React.Fragment key={index}>
                    {/* Point */}
                    <View 
                      style={[
                        styles.linePoint, 
                        { 
                          left: pointX,
                          top: pointY,
                          backgroundColor: colors.primary,
                          borderColor: colors.surface,
                        }
                      ]} 
                    />
                    
                    {/* Line segment to next point */}
                    {index < data.datasets[0].data.length - 1 && (
                      <View 
                        style={[
                          styles.lineSegment,
                          {
                            left: pointX + 6,
                            top: pointY + 6,
                            width: (chartWidth - 80) / Math.max(data.datasets[0].data.length - 1, 1) - 12,
                            backgroundColor: colors.primary,
                            transform: [{
                              rotate: `${Math.atan2(
                                ((maxValue - data.datasets[0].data[index + 1]) / range) * chartHeight - pointY,
                                (chartWidth - 80) / Math.max(data.datasets[0].data.length - 1, 1)
                              )}rad`
                            }]
                          }
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
            
            {/* X-Axis Labels */}
            <View style={styles.xAxisLabels}>
              {data.labels.map((label, index) => (
                <Text key={index} style={[styles.xAxisLabel, { color: colors.onSurfaceVariant }]}>
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPieChart = () => {
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    const chartColors = generateColors(data.datasets[0].data.length);
    const radius = 80;
    const centerX = radius;
    const centerY = radius;

    let currentAngle = -90; // Start from top

    return (
      <View style={[styles.pieChart, { height }]}>
        <View style={styles.pieContainer}>
          <View style={[styles.pieCircle, { width: radius * 2, height: radius * 2 }]}>
            {data.datasets[0].data.map((value, index) => {
              const percentage = (value / total) * 100;
              const angle = (value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              // Calculate path for pie slice
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              
              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              currentAngle += angle;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.pieSlice,
                    {
                      backgroundColor: chartColors[index],
                      transform: [
                        { rotate: `${startAngle}deg` }
                      ],
                      width: radius,
                      height: radius,
                      borderRadius: type === 'doughnut' ? radius / 4 : 0,
                    }
                  ]}
                />
              );
            })}
            
            {/* Center hole for doughnut chart */}
            {type === 'doughnut' && (
              <View style={[
                styles.doughnutHole, 
                { 
                  backgroundColor: colors.surface,
                  width: radius,
                  height: radius,
                  borderRadius: radius / 2,
                }
              ]} />
            )}
          </View>
        </View>
        
        {showLegend && (
          <View style={styles.pieLegend}>
            {data.labels.map((label, index) => {
              const value = data.datasets[0].data[index];
              const percentage = ((value / total) * 100).toFixed(1);
              return (
                <View key={index} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendColor, 
                      { backgroundColor: chartColors[index] }
                    ]} 
                  />
                  <Text style={[styles.legendText, { color: colors.onSurface }]}>
                    {label}
                  </Text>
                  <Text style={[styles.legendValue, { color: colors.onSurfaceVariant }]}>
                    {percentage}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
      case 'area':
        return renderLineChart();
      case 'pie':
      case 'doughnut':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <ChartIcon size={20} color={colors.primary} />
          {title && (
            <Text style={[styles.title, { color: colors.onSurface }]}>
              {title}
            </Text>
          )}
        </View>
        
        <View style={styles.actions}>
          {onExpand && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primaryContainer }]}
              onPress={onExpand}
            >
              <Maximize2 size={16} color={colors.onPrimaryContainer} />
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

      {/* Chart */}
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>

      {/* Data Summary */}
      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.onSurfaceVariant }]}>
          {data.datasets[0].data.length} data points • 
          Total: {data.datasets[0].data.reduce((sum, val) => sum + val, 0).toLocaleString()}
        </Text>
      </View>
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
  chartContainer: {
    marginBottom: spacing.sm,
  },
  summary: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  
  // Bar Chart Styles
  barChart: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 50,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 40,
    justifyContent: 'space-between',
  },
  gridLine: {
    borderTopWidth: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 20,
    paddingBottom: 40,
    height: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    minWidth: 50,
    flex: 1,
  },
  barContainer: {
    height: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    marginBottom: spacing.xs,
    minHeight: 2,
  },
  barValue: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: 60,
  },

  // Line Chart Styles
  lineChart: {
    flexDirection: 'row',
  },
  lineContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 40,
  },
  linePoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 2,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
    zIndex: 1,
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  xAxisLabel: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: 60,
  },

  // Pie Chart Styles
  pieChart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieSlice: {
    position: 'absolute',
    transformOrigin: '100% 50%',
  },
  doughnutHole: {
    position: 'absolute',
    zIndex: 10,
  },
  pieLegend: {
    flex: 1,
    paddingLeft: spacing.md,
    maxHeight: 160,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingVertical: 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  legendValue: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    marginLeft: spacing.xs,
  },
});