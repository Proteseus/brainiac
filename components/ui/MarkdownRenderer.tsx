import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme, spacing, borderRadius } from '@/constants/Theme';

interface MarkdownRendererProps {
  content: string;
  style?: any;
}

interface MarkdownElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'underline';
  content: string;
  url?: string;
}

export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  const { colors } = useTheme();

  const parseInlineMarkdown = (text: string): MarkdownElement[] => {
    const elements: MarkdownElement[] = [];
    let currentIndex = 0;

    // Regex patterns for different markdown elements
    const patterns = [
      { type: 'bold', regex: /\*\*(.*?)\*\*/g },
      { type: 'bold', regex: /__(.*?)__/g },
      { type: 'italic', regex: /\*(.*?)\*/g },
      { type: 'italic', regex: /_(.*?)_/g },
      { type: 'code', regex: /`(.*?)`/g },
      { type: 'strikethrough', regex: /~~(.*?)~~/g },
      { type: 'underline', regex: /<u>(.*?)<\/u>/g },
      { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g },
    ];

    // Find all matches and their positions
    const matches: Array<{
      type: string;
      start: number;
      end: number;
      content: string;
      url?: string;
    }> = [];

    patterns.forEach(({ type, regex }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type,
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          url: match[2], // For links
        });
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Process text and create elements
    matches.forEach((match) => {
      // Add text before the match
      if (match.start > currentIndex) {
        const textBefore = text.substring(currentIndex, match.start);
        if (textBefore) {
          elements.push({ type: 'text', content: textBefore });
        }
      }

      // Add the formatted element
      elements.push({
        type: match.type as any,
        content: match.content,
        url: match.url,
      });

      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        elements.push({ type: 'text', content: remainingText });
      }
    }

    return elements.length > 0 ? elements : [{ type: 'text', content: text }];
  };

  const renderInlineElements = (elements: MarkdownElement[]) => {
    return elements.map((element, index) => {
      const key = `${element.type}-${index}`;
      
      switch (element.type) {
        case 'bold':
          return (
            <Text key={key} style={[styles.bold, { color: colors.onSurface }]}>
              {element.content}
            </Text>
          );
        case 'italic':
          return (
            <Text key={key} style={[styles.italic, { color: colors.onSurface }]}>
              {element.content}
            </Text>
          );
        case 'code':
          return (
            <Text key={key} style={[styles.inlineCode, { 
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurfaceVariant 
            }]}>
              {element.content}
            </Text>
          );
        case 'strikethrough':
          return (
            <Text key={key} style={[styles.strikethrough, { color: colors.onSurface }]}>
              {element.content}
            </Text>
          );
        case 'underline':
          return (
            <Text key={key} style={[styles.underline, { color: colors.onSurface }]}>
              {element.content}
            </Text>
          );
        case 'link':
          return (
            <TouchableOpacity key={key} onPress={() => console.log('Open link:', element.url)}>
              <Text style={[styles.link, { color: colors.primary }]}>
                {element.content}
              </Text>
            </TouchableOpacity>
          );
        default:
          return (
            <Text key={key} style={{ color: colors.onSurface }}>
              {element.content}
            </Text>
          );
      }
    });
  };

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let currentOrderedList: string[] = [];
    let currentCodeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let currentTable: string[][] = [];
    let inTable = false;
    let currentQuote: string[] = [];
    let inQuote = false;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <View key={`list-${elements.length}`} style={styles.list}>
            {currentList.map((item, index) => {
              const cleanItem = item.replace(/^[-*+]\s+/, '');
              const inlineElements = parseInlineMarkdown(cleanItem);
              return (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                  <View style={styles.listContent}>
                    <Text style={[styles.listItemText, { color: colors.onSurface }]}>
                      {renderInlineElements(inlineElements)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
        currentList = [];
      }
    };

    const flushOrderedList = () => {
      if (currentOrderedList.length > 0) {
        elements.push(
          <View key={`ordered-list-${elements.length}`} style={styles.list}>
            {currentOrderedList.map((item, index) => {
              const cleanItem = item.replace(/^\d+\.\s+/, '');
              const inlineElements = parseInlineMarkdown(cleanItem);
              return (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.orderedBullet, { color: colors.primary }]}>
                    {index + 1}.
                  </Text>
                  <View style={styles.listContent}>
                    <Text style={[styles.listItemText, { color: colors.onSurface }]}>
                      {renderInlineElements(inlineElements)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
        currentOrderedList = [];
      }
    };

    const flushCodeBlock = () => {
      if (currentCodeBlock.length > 0) {
        elements.push(
          <View key={`code-${elements.length}`} style={[styles.codeBlock, { 
            backgroundColor: colors.surfaceVariant,
            borderLeftColor: colors.primary 
          }]}>
            {codeLanguage && (
              <Text style={[styles.codeLanguage, { color: colors.primary }]}>
                {codeLanguage}
              </Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={[styles.codeText, { color: colors.onSurfaceVariant }]}>
                {currentCodeBlock.join('\n')}
              </Text>
            </ScrollView>
          </View>
        );
        currentCodeBlock = [];
        codeLanguage = '';
      }
    };

    const flushTable = () => {
      if (currentTable.length > 0) {
        elements.push(
          <ScrollView 
            key={`table-${elements.length}`} 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tableContainer}
          >
            <View style={[styles.table, { borderColor: colors.outline }]}>
              {currentTable.map((row, rowIndex) => (
                <View key={rowIndex} style={[
                  styles.tableRow, 
                  { borderBottomColor: colors.outline },
                  rowIndex === 0 && { backgroundColor: colors.primaryContainer }
                ]}>
                  {row.map((cell, cellIndex) => (
                    <View key={cellIndex} style={[
                      styles.tableCell, 
                      { borderRightColor: colors.outline }
                    ]}>
                      <Text style={[
                        rowIndex === 0 ? styles.tableHeader : styles.tableCellText,
                        { 
                          color: rowIndex === 0 
                            ? colors.onPrimaryContainer 
                            : colors.onSurface 
                        }
                      ]}>
                        {cell.trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        );
        currentTable = [];
        inTable = false;
      }
    };

    const flushQuote = () => {
      if (currentQuote.length > 0) {
        elements.push(
          <View key={`quote-${elements.length}`} style={[styles.blockquote, { 
            borderLeftColor: colors.primary,
            backgroundColor: colors.surfaceVariant 
          }]}>
            {currentQuote.map((quoteLine, index) => {
              const cleanLine = quoteLine.replace(/^>\s*/, '');
              const inlineElements = parseInlineMarkdown(cleanLine);
              return (
                <View key={index} style={styles.quoteLine}>
                  <Text style={[styles.quoteText, { color: colors.onSurface }]}>
                    {renderInlineElements(inlineElements)}
                  </Text>
                </View>
              );
            })}
          </View>
        );
        currentQuote = [];
        inQuote = false;
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
          flushOrderedList();
          flushTable();
          flushQuote();
          inCodeBlock = true;
          codeLanguage = line.trim().substring(3);
        }
        return;
      }

      if (inCodeBlock) {
        currentCodeBlock.push(line);
        return;
      }

      // Handle blockquotes
      if (line.trim().startsWith('>')) {
        flushList();
        flushOrderedList();
        flushTable();
        currentQuote.push(line.trim());
        inQuote = true;
        return;
      } else if (inQuote) {
        flushQuote();
      }

      // Handle tables
      if (line.includes('|') && line.trim().length > 0) {
        flushList();
        flushOrderedList();
        flushQuote();
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        if (cells.length > 1) {
          // Skip separator rows (like |---|---|)
          if (!cells.every(cell => /^-+$/.test(cell))) {
            currentTable.push(cells);
            inTable = true;
          }
          return;
        }
      } else if (inTable) {
        flushTable();
      }

      // Handle horizontal rules
      if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        flushList();
        flushOrderedList();
        flushTable();
        flushQuote();
        elements.push(
          <View key={index} style={[styles.horizontalRule, { backgroundColor: colors.outline }]} />
        );
        return;
      }

      // Handle headers
      if (line.startsWith('#')) {
        flushList();
        flushOrderedList();
        flushTable();
        flushQuote();
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        const inlineElements = parseInlineMarkdown(text);
        
        elements.push(
          <View key={index} style={styles.headerContainer}>
            <Text style={[
              level === 1 ? styles.h1 : 
              level === 2 ? styles.h2 : 
              level === 3 ? styles.h3 :
              level === 4 ? styles.h4 :
              level === 5 ? styles.h5 : styles.h6,
              { color: colors.onSurface }
            ]}>
              {renderInlineElements(inlineElements)}
            </Text>
          </View>
        );
        return;
      }

      // Handle ordered lists
      if (line.match(/^\s*\d+\.\s+/)) {
        flushList();
        flushTable();
        flushQuote();
        currentOrderedList.push(line.trim());
        return;
      } else {
        flushOrderedList();
      }

      // Handle unordered lists
      if (line.match(/^\s*[-*+]\s+/)) {
        flushOrderedList();
        flushTable();
        flushQuote();
        currentList.push(line.trim());
        return;
      } else {
        flushList();
      }

      // Handle regular paragraphs
      if (line.trim().length > 0) {
        flushTable();
        flushQuote();
        const inlineElements = parseInlineMarkdown(line);
        elements.push(
          <View key={index} style={styles.paragraphContainer}>
            <Text style={[styles.paragraph, { color: colors.onSurface }]}>
              {renderInlineElements(inlineElements)}
            </Text>
          </View>
        );
      } else {
        elements.push(<View key={index} style={styles.spacing} />);
      }
    });

    // Flush any remaining content
    flushList();
    flushOrderedList();
    flushCodeBlock();
    flushTable();
    flushQuote();

    return elements;
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
  headerContainer: {
    marginVertical: spacing.sm,
  },
  h1: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    lineHeight: 36,
    marginVertical: spacing.md,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    lineHeight: 32,
    marginVertical: spacing.md,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 28,
    marginVertical: spacing.sm,
  },
  h4: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 26,
    marginVertical: spacing.sm,
  },
  h5: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
    marginVertical: spacing.sm,
  },
  h6: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
    marginVertical: spacing.sm,
  },
  paragraphContainer: {
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  bold: {
    fontFamily: 'Inter-Bold',
  },
  italic: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  link: {
    textDecorationLine: 'underline',
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
    minWidth: 16,
  },
  orderedBullet: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginRight: spacing.sm,
    marginTop: 2,
    minWidth: 20,
  },
  listContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  codeBlock: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
    borderLeftWidth: 4,
  },
  codeLanguage: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'Courier',
    lineHeight: 20,
  },
  tableContainer: {
    marginVertical: spacing.md,
  },
  table: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    minWidth: 300,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    padding: spacing.sm,
    borderRightWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    minWidth: 100,
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
  blockquote: {
    borderLeftWidth: 4,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  quoteLine: {
    marginBottom: spacing.xs,
  },
  quoteText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  horizontalRule: {
    height: 2,
    marginVertical: spacing.lg,
    borderRadius: 1,
  },
  spacing: {
    height: spacing.sm,
  },
});