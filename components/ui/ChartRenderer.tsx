import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

interface ChartRendererProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: ChartData;
  title?: string;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export function ChartRenderer({ type, data, title, height = 200 }: ChartRendererProps) {
  const { colors } = useTheme();

  const renderBarChart = () => {
    const maxValue = Math.max(...data.datasets[0].data);
    const chartWidth = Math.max(screenWidth - 64, data.labels.length * 60);
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.barChart, { width: chartWidth, height }]}>
          <View style={styles.yAxis}>
            {[...Array(5)].map((_, index) => {
              const value = Math.round((maxValue * (4 - index)) / 4);
              return (
                <Text key={index} style={[styles.yAxisLabel, { color: colors.onSurfaceVariant }]}>
                  {value}
                </Text>
              );
            })}
          </View>
          
          <View style={styles.chartArea}>
            <View style={styles.gridLines}>
              {[...Array(5)].map((_, index) => (
                <View 
                  key={index} 
                  style={[styles.gridLine, { borderTopColor: colors.outline }]} 
                />
              ))}
            </View>
            
            <View style={styles.barsContainer}>
              {data.datasets[0].data.map((value, index) => {
                const barHeight = (value / maxValue) * (height - 60);
                return (
                  <View key={index} style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: barHeight,
                          backgroundColor: colors.primary,
                        }
                      ]} 
                    />
                    <Text style={[styles.barValue, { color: colors.onSurface }]}>
                      {value}
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

  const renderPieChart = () => {
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    const colors_palette = [
      colors.primary,
      colors.secondary,
      colors.tertiary,
      colors.error,
      colors.primaryContainer,
      colors.secondaryContainer,
    ];

    return (
      <View style={[styles.pieChart, { height }]}>
        <View style={styles.pieContainer}>
          <View style={[styles.pieCircle, { borderColor: colors.outline }]}>
            {data.datasets[0].data.map((value, index) => {
              const percentage = (value / total) * 100;
              return (
                <View
                  key={index}
                  style={[
                    styles.pieSlice,
                    {
                      backgroundColor: colors_palette[index % colors_palette.length],
                      transform: [{ rotate: `${(index * 360) / data.datasets[0].data.length}deg` }],
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
        
        <View style={styles.pieLegend}>
          {data.labels.map((label, index) => {
            const value = data.datasets[0].data[index];
            const percentage = ((value / total) * 100).toFixed(1);
            return (
              <View key={index} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor, 
                    { backgroundColor: colors_palette[index % colors_palette.length] }
                  ]} 
                />
                <Text style={[styles.legendText, { color: colors.onSurface }]}>
                  {label}: {percentage}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...data.datasets[0].data);
    const minValue = Math.min(...data.datasets[0].data);
    const range = maxValue - minValue;
    const chartWidth = Math.max(screenWidth - 64, data.labels.length * 80);

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.lineChart, { width: chartWidth, height }]}>
          <View style={styles.yAxis}>
            {[...Array(5)].map((_, index) => {
              const value = Math.round(minValue + (range * (4 - index)) / 4);
              return (
                <Text key={index} style={[styles.yAxisLabel, { color: colors.onSurfaceVariant }]}>
                  {value}
                </Text>
              );
            })}
          </View>
          
          <View style={styles.chartArea}>
            <View style={styles.gridLines}>
              {[...Array(5)].map((_, index) => (
                <View 
                  key={index} 
                  style={[styles.gridLine, { borderTopColor: colors.outline }]} 
                />
              ))}
            </View>
            
            <View style={styles.lineContainer}>
              {data.datasets[0].data.map((value, index) => {
                const pointY = ((maxValue - value) / range) * (height - 60);
                const pointX = (index / (data.datasets[0].data.length - 1)) * (chartWidth - 80);
                
                return (
                  <View key={index}>
                    <View 
                      style={[
                        styles.linePoint, 
                        { 
                          left: pointX,
                          top: pointY,
                          backgroundColor: colors.primary,
                        }
                      ]} 
                    />
                    {index < data.datasets[0].data.length - 1 && (
                      <View 
                        style={[
                          styles.lineSegment,
                          {
                            left: pointX + 4,
                            top: pointY + 4,
                            width: (chartWidth - 80) / (data.datasets[0].data.length - 1) - 8,
                            backgroundColor: colors.primary,
                          }
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            
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

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
      case 'doughnut':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {title && (
        <Text style={[styles.title, { color: colors.onSurface }]}>
          {title}
        </Text>
      )}
      {renderChart()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  yAxisLabel: {
    fontSize: 12,
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
    opacity: 0.3,
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
    minWidth: 40,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  barValue: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginBottom: spacing.xs,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: 50,
  },
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  pieSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: '50%',
    transformOrigin: '0 100%',
  },
  pieLegend: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  },
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
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
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: 60,
  },
});