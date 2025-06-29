import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';

interface MarkdownRendererProps {
  content: string;
  style?: any;
}

export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  const { colors } = useTheme();

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let currentCodeBlock: string[] = [];
    let inCodeBlock = false;
    let currentTable: string[][] = [];
    let inTable = false;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <View key={`list-${elements.length}`} style={styles.list}>
            {currentList.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.listText, { color: colors.onSurface }]}>
                  {item.replace(/^[-*+]\s+/, '')}
                </Text>
              </View>
            ))}
          </View>
        );
        currentList = [];
      }
    };

    const flushCodeBlock = () => {
      if (currentCodeBlock.length > 0) {
        elements.push(
          <View key={`code-${elements.length}`} style={[styles.codeBlock, { backgroundColor: colors.surfaceVariant }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={[styles.codeText, { color: colors.onSurfaceVariant }]}>
                {currentCodeBlock.join('\n')}
              </Text>
            </ScrollView>
          </View>
        );
        currentCodeBlock = [];
      }
    };

    const flushTable = () => {
      if (currentTable.length > 0) {
        elements.push(
          <View key={`table-${elements.length}`} style={[styles.table, { borderColor: colors.outline }]}>
            {currentTable.map((row, rowIndex) => (
              <View key={rowIndex} style={[styles.tableRow, { borderBottomColor: colors.outline }]}>
                {row.map((cell, cellIndex) => (
                  <View key={cellIndex} style={[styles.tableCell, { borderRightColor: colors.outline }]}>
                    <Text style={[
                      rowIndex === 0 ? styles.tableHeader : styles.tableCellText,
                      { color: rowIndex === 0 ? colors.onPrimaryContainer : colors.onSurface }
                    ]}>
                      {cell.trim()}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
        currentTable = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushList();
          flushTable();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        currentCodeBlock.push(line);
        return;
      }

      // Handle tables
      if (line.includes('|') && line.trim().length > 0) {
        flushList();
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        if (cells.length > 1) {
          currentTable.push(cells);
          inTable = true;
          return;
        }
      } else if (inTable) {
        flushTable();
      }

      // Handle headers
      if (line.startsWith('#')) {
        flushList();
        flushTable();
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        
        elements.push(
          <Text key={index} style={[
            level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3,
            { color: colors.onSurface }
          ]}>
            {text}
          </Text>
        );
        return;
      }

      // Handle lists
      if (line.match(/^\s*[-*+]\s+/)) {
        flushTable();
        currentList.push(line.trim());
        return;
      } else {
        flushList();
      }

      // Handle regular paragraphs
      if (line.trim().length > 0) {
        flushTable();
        const processedText = processInlineMarkdown(line);
        elements.push(
          <Text key={index} style={[styles.paragraph, { color: colors.onSurface }]}>
            {processedText}
          </Text>
        );
      } else {
        elements.push(<View key={index} style={styles.spacing} />);
      }
    });

    // Flush any remaining content
    flushList();
    flushCodeBlock();
    flushTable();

    return elements;
  };

  const processInlineMarkdown = (text: string) => {
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, (match, content) => content);
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, (match, content) => content);
    // Handle inline code
    text = text.replace(/`(.*?)`/g, (match, content) => content);
    
    return text;
  };

  return (
    <View style={[styles.container, style]}>
      {parseMarkdown(content)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  h1: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginVertical: spacing.lg,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginVertical: spacing.md,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginVertical: spacing.sm,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  list: {
    marginVertical: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  bullet: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  listText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    flex: 1,
  },
  codeBlock: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#007ACC',
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'Courier',
    lineHeight: 20,
  },
  table: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    padding: spacing.sm,
    borderRightWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  tableHeader: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  spacing: {
    height: spacing.sm,
  },
});