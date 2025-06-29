export interface DocumentMetadata {
  title: string;
  fileType: 'pdf' | 'txt' | 'md' | 'docx' | 'csv' | 'json';
  fileSize: number;
  wordCount: number;
  pageCount?: number;
  language?: string;
  encoding?: string;
  createdAt: Date;
  lastModified?: Date;
}

export interface AnalysisTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'academic' | 'legal' | 'technical' | 'creative' | 'financial';
  prompts: {
    summary: string;
    insights: string;
    recommendations: string;
    technical: string;
    custom?: string[];
  };
  outputFormat: 'structured' | 'narrative' | 'bullet_points' | 'table';
  estimatedTime: number; // in seconds
}

export interface AnalysisConfiguration {
  template: AnalysisTemplate;
  depth: 'quick' | 'standard' | 'comprehensive' | 'expert';
  focus: string[]; // Areas to focus on
  excludeTopics?: string[]; // Topics to avoid
  outputLanguage: string;
  includeVisualization: boolean;
  compareWithPrevious?: boolean;
}

export interface AnalysisResult {
  id: string;
  documentId: string;
  configuration: AnalysisConfiguration;
  metadata: DocumentMetadata;
  sections: {
    executive_summary: AnalysisSection;
    key_insights: AnalysisSection;
    detailed_analysis: AnalysisSection;
    recommendations: AnalysisSection;
    technical_details: AnalysisSection;
    risk_assessment?: AnalysisSection;
    opportunities?: AnalysisSection;
    comparative_analysis?: AnalysisSection;
    custom_sections?: AnalysisSection[];
  };
  confidence_score: number;
  processing_time: number;
  word_count: number;
  readability_score?: number;
  sentiment_analysis?: SentimentResult;
  key_entities?: EntityResult[];
  topics?: TopicResult[];
  visualizations?: VisualizationData[];
  created_at: Date;
  updated_at: Date;
}

export interface AnalysisSection {
  title: string;
  content: string;
  confidence: number;
  word_count: number;
  key_points: string[];
  citations?: string[];
  related_sections?: string[];
}

export interface SentimentResult {
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  emotional_tone: string[];
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface EntityResult {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'percentage' | 'other';
  confidence: number;
  context: string;
}

export interface TopicResult {
  topic: string;
  relevance: number;
  keywords: string[];
  frequency: number;
}

export interface VisualizationData {
  type: 'chart' | 'graph' | 'wordcloud' | 'timeline' | 'network';
  title: string;
  data: any;
  description: string;
}

export class DocumentAnalysisFramework {
  private templates: AnalysisTemplate[] = [
    {
      id: 'business-report',
      name: 'Business Report Analysis',
      description: 'Comprehensive analysis for business documents, reports, and proposals',
      category: 'business',
      prompts: {
        summary: 'Provide an executive summary focusing on key business metrics, objectives, and outcomes.',
        insights: 'Identify critical business insights, market trends, competitive advantages, and strategic implications.',
        recommendations: 'Suggest actionable business recommendations based on the analysis, including implementation strategies.',
        technical: 'Detail technical specifications, methodologies, and data analysis approaches used.',
      },
      outputFormat: 'structured',
      estimatedTime: 120,
    },
    {
      id: 'academic-research',
      name: 'Academic Research Analysis',
      description: 'In-depth analysis for academic papers, research documents, and scholarly articles',
      category: 'academic',
      prompts: {
        summary: 'Summarize the research objectives, methodology, key findings, and conclusions.',
        insights: 'Analyze the research contribution, novelty, limitations, and implications for the field.',
        recommendations: 'Suggest areas for future research, methodology improvements, and practical applications.',
        technical: 'Examine the research methodology, statistical analysis, and technical approaches used.',
      },
      outputFormat: 'structured',
      estimatedTime: 180,
    },
    {
      id: 'legal-document',
      name: 'Legal Document Analysis',
      description: 'Specialized analysis for contracts, legal briefs, and regulatory documents',
      category: 'legal',
      prompts: {
        summary: 'Summarize key legal provisions, obligations, rights, and terms.',
        insights: 'Identify potential legal risks, compliance issues, and strategic considerations.',
        recommendations: 'Suggest legal strategies, risk mitigation approaches, and compliance measures.',
        technical: 'Analyze legal precedents, regulatory requirements, and procedural aspects.',
      },
      outputFormat: 'structured',
      estimatedTime: 150,
    },
    {
      id: 'technical-specification',
      name: 'Technical Specification Analysis',
      description: 'Detailed analysis for technical documents, specifications, and engineering reports',
      category: 'technical',
      prompts: {
        summary: 'Summarize technical requirements, specifications, and system architecture.',
        insights: 'Analyze technical feasibility, performance implications, and design considerations.',
        recommendations: 'Suggest technical improvements, optimization strategies, and implementation approaches.',
        technical: 'Detail technical specifications, algorithms, protocols, and implementation details.',
      },
      outputFormat: 'structured',
      estimatedTime: 140,
    },
    {
      id: 'financial-analysis',
      name: 'Financial Document Analysis',
      description: 'Comprehensive analysis for financial reports, statements, and investment documents',
      category: 'financial',
      prompts: {
        summary: 'Summarize financial performance, key metrics, and overall financial health.',
        insights: 'Analyze financial trends, ratios, risks, and growth opportunities.',
        recommendations: 'Suggest financial strategies, investment recommendations, and risk management approaches.',
        technical: 'Detail financial methodologies, calculations, and analytical frameworks used.',
      },
      outputFormat: 'structured',
      estimatedTime: 130,
    },
  ];

  getTemplates(): AnalysisTemplate[] {
    return this.templates;
  }

  getTemplatesByCategory(category: string): AnalysisTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  getTemplate(id: string): AnalysisTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  // Sanitize content to remove problematic Unicode characters
  private sanitizeContent(content: string): string {
    if (!content) return '';
    
    return content
      // Remove null bytes and other control characters
      .replace(/\u0000/g, '')
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      // Replace problematic Unicode escape sequences
      .replace(/\\u0000/g, '')
      .replace(/\\u([0-9A-Fa-f]{4})/g, (match, hex) => {
        const codePoint = parseInt(hex, 16);
        // Skip control characters and null bytes
        if (codePoint === 0 || (codePoint >= 1 && codePoint <= 31) || codePoint === 127) {
          return '';
        }
        return String.fromCharCode(codePoint);
      })
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Sanitize title to ensure it's safe for database storage
  private sanitizeTitle(title: string): string {
    if (!title) return 'Untitled Document';
    
    return this.sanitizeContent(title)
      .substring(0, 255) // Limit title length
      .trim() || 'Untitled Document';
  }

  async analyzeDocument(
    content: string,
    metadata: DocumentMetadata,
    configuration: AnalysisConfiguration,
    apiKey: string,
    provider: 'deepseek' | 'gemini',
    onProgress?: (progress: { progress: number; message: string; stage: string }) => void
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Stage 1: Document preprocessing and sanitization
      onProgress?.({ progress: 5, message: 'Preprocessing document...', stage: 'preprocessing' });
      const sanitizedContent = this.sanitizeContent(content);
      const sanitizedMetadata = {
        ...metadata,
        title: this.sanitizeTitle(metadata.title),
      };
      
      if (!sanitizedContent.trim()) {
        throw new Error('Document content is empty or contains only invalid characters');
      }
      
      const preprocessedContent = await this.preprocessDocument(sanitizedContent, sanitizedMetadata);
      
      // Stage 2: Metadata extraction
      onProgress?.({ progress: 15, message: 'Extracting document metadata...', stage: 'metadata' });
      const enhancedMetadata = await this.extractMetadata(preprocessedContent, sanitizedMetadata);
      
      // Stage 3: Content analysis
      onProgress?.({ progress: 25, message: 'Analyzing document structure...', stage: 'structure' });
      const structureAnalysis = await this.analyzeStructure(preprocessedContent);
      
      // Stage 4: AI-powered analysis
      onProgress?.({ progress: 40, message: 'Performing AI analysis...', stage: 'ai_analysis' });
      const aiAnalysis = await this.performAIAnalysis(
        preprocessedContent,
        configuration,
        apiKey,
        provider,
        (progress) => onProgress?.({ 
          progress: 40 + (progress * 0.4), 
          message: 'AI analysis in progress...', 
          stage: 'ai_analysis' 
        })
      );
      
      // Stage 5: Entity extraction
      onProgress?.({ progress: 80, message: 'Extracting entities and topics...', stage: 'entities' });
      const entities = await this.extractEntities(preprocessedContent);
      const topics = await this.extractTopics(preprocessedContent);
      
      // Stage 6: Sentiment analysis
      onProgress?.({ progress: 85, message: 'Analyzing sentiment...', stage: 'sentiment' });
      const sentiment = await this.analyzeSentiment(preprocessedContent);
      
      // Stage 7: Generate visualizations
      onProgress?.({ progress: 90, message: 'Generating visualizations...', stage: 'visualizations' });
      const visualizations = configuration.includeVisualization 
        ? await this.generateVisualizations(preprocessedContent, aiAnalysis, entities, topics)
        : [];
      
      // Stage 8: Compile results
      onProgress?.({ progress: 95, message: 'Compiling analysis results...', stage: 'compilation' });
      const result: AnalysisResult = {
        id: this.generateId(),
        documentId: this.generateId(),
        configuration,
        metadata: enhancedMetadata,
        sections: aiAnalysis,
        confidence_score: this.calculateConfidenceScore(aiAnalysis),
        processing_time: Date.now() - startTime,
        word_count: this.countWords(preprocessedContent),
        readability_score: this.calculateReadabilityScore(preprocessedContent),
        sentiment_analysis: sentiment,
        key_entities: entities,
        topics,
        visualizations,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      onProgress?.({ progress: 100, message: 'Analysis complete!', stage: 'complete' });
      return result;
      
    } catch (error) {
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async preprocessDocument(content: string, metadata: DocumentMetadata): Promise<string> {
    // Clean and normalize the document content
    let processed = content;
    
    // Remove excessive whitespace
    processed = processed.replace(/\s+/g, ' ').trim();
    
    // Handle different file types
    switch (metadata.fileType) {
      case 'pdf':
        // PDF-specific preprocessing
        processed = this.cleanPdfText(processed);
        break;
      case 'md':
        // Markdown-specific preprocessing
        processed = this.cleanMarkdown(processed);
        break;
      case 'csv':
        // CSV-specific preprocessing
        processed = this.processCsvContent(processed);
        break;
    }
    
    return processed;
  }

  private cleanPdfText(content: string): string {
    // Remove PDF artifacts and improve text flow
    return content
      .replace(/\f/g, '\n') // Form feed to newline
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanMarkdown(content: string): string {
    // Remove markdown syntax for analysis
    return content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .trim();
  }

  private processCsvContent(content: string): string {
    // Convert CSV to readable format for analysis
    const lines = content.split('\n');
    const headers = lines[0]?.split(',') || [];
    const rows = lines.slice(1);
    
    let processed = `Data Analysis Summary:\n`;
    processed += `Headers: ${headers.join(', ')}\n`;
    processed += `Total rows: ${rows.length}\n\n`;
    
    // Add sample data for context
    if (rows.length > 0) {
      processed += `Sample data:\n`;
      rows.slice(0, 5).forEach((row, index) => {
        processed += `Row ${index + 1}: ${row}\n`;
      });
    }
    
    return processed;
  }

  private async extractMetadata(content: string, metadata: DocumentMetadata): Promise<DocumentMetadata> {
    return {
      ...metadata,
      wordCount: this.countWords(content),
      language: this.detectLanguage(content),
      encoding: 'UTF-8',
    };
  }

  private async analyzeStructure(content: string): Promise<any> {
    // Analyze document structure (headings, sections, etc.)
    const lines = content.split('\n');
    const structure = {
      sections: [],
      headings: [],
      paragraphs: lines.filter(line => line.trim().length > 50).length,
      lists: (content.match(/^\s*[-*+]\s+/gm) || []).length,
    };
    
    return structure;
  }

  private async performAIAnalysis(
    content: string,
    configuration: AnalysisConfiguration,
    apiKey: string,
    provider: 'deepseek' | 'gemini',
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const template = configuration.template;
    const sections: any = {};
    
    // Perform analysis for each section
    const sectionKeys = Object.keys(template.prompts);
    for (let i = 0; i < sectionKeys.length; i++) {
      const key = sectionKeys[i];
      const prompt = template.prompts[key as keyof typeof template.prompts];
      
      if (typeof prompt === 'string') {
        onProgress?.((i / sectionKeys.length) * 100);
        
        const sectionResult = await this.callAIProvider(
          content,
          prompt,
          configuration,
          apiKey,
          provider
        );
        
        // Sanitize AI response content
        const sanitizedResult = this.sanitizeContent(sectionResult);
        
        sections[key] = {
          title: this.formatSectionTitle(key),
          content: sanitizedResult,
          confidence: 0.85, // Placeholder confidence score
          word_count: this.countWords(sanitizedResult),
          key_points: this.extractKeyPoints(sanitizedResult),
        };
      }
    }
    
    return sections;
  }

  private async callAIProvider(
    content: string,
    prompt: string,
    configuration: AnalysisConfiguration,
    apiKey: string,
    provider: 'deepseek' | 'gemini'
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(configuration);
    const userPrompt = `${prompt}\n\nDocument content:\n${content}`;
    
    if (provider === 'deepseek') {
      return this.callDeepSeekAPI(systemPrompt, userPrompt, apiKey);
    } else {
      return this.callGeminiAPI(systemPrompt, userPrompt, apiKey);
    }
  }

  private buildSystemPrompt(configuration: AnalysisConfiguration): string {
    let systemPrompt = `You are an expert document analyst specializing in ${configuration.template.category} analysis. `;
    systemPrompt += `Provide ${configuration.depth} analysis with focus on: ${configuration.focus.join(', ')}. `;
    systemPrompt += `Output format: ${configuration.template.outputFormat}. `;
    systemPrompt += `Language: ${configuration.outputLanguage}. `;
    
    if (configuration.excludeTopics && configuration.excludeTopics.length > 0) {
      systemPrompt += `Avoid discussing: ${configuration.excludeTopics.join(', ')}. `;
    }
    
    return systemPrompt;
  }

  private async callDeepSeekAPI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGeminiAPI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (response.statusText) {
          errorMessage = response.statusText;
        } else {
          errorMessage = `HTTP ${response.status}`;
        }
      } catch {
        // If JSON parsing fails, use status text or status code
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      throw new Error(`Gemini API error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async extractEntities(content: string): Promise<EntityResult[]> {
    // Simple entity extraction (in production, use NLP libraries)
    const entities: EntityResult[] = [];
    
    // Extract dates
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const dates = content.match(dateRegex) || [];
    dates.forEach(date => {
      entities.push({
        text: date,
        type: 'date',
        confidence: 0.8,
        context: this.getContext(content, date),
      });
    });
    
    // Extract percentages
    const percentageRegex = /\b\d+(?:\.\d+)?%\b/g;
    const percentages = content.match(percentageRegex) || [];
    percentages.forEach(percentage => {
      entities.push({
        text: percentage,
        type: 'percentage',
        confidence: 0.9,
        context: this.getContext(content, percentage),
      });
    });
    
    // Extract money amounts
    const moneyRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
    const amounts = content.match(moneyRegex) || [];
    amounts.forEach(amount => {
      entities.push({
        text: amount,
        type: 'money',
        confidence: 0.9,
        context: this.getContext(content, amount),
      });
    });
    
    return entities;
  }

  private async extractTopics(content: string): Promise<TopicResult[]> {
    // Simple topic extraction using keyword frequency
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount: { [key: string]: number } = {};
    
    // Count word frequencies
    words.forEach(word => {
      if (word.length > 3) { // Ignore short words
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // Get top topics
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    return sortedWords.map(([word, frequency]) => ({
      topic: word,
      relevance: frequency / words.length,
      keywords: [word],
      frequency,
    }));
  }

  private async analyzeSentiment(content: string): Promise<SentimentResult> {
    // Simple sentiment analysis (in production, use proper NLP)
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'benefit', 'advantage'];
    const negativeWords = ['bad', 'poor', 'negative', 'problem', 'issue', 'risk', 'disadvantage'];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    const positiveRatio = total > 0 ? positiveCount / total : 0.5;
    const negativeRatio = total > 0 ? negativeCount / total : 0.5;
    const neutralRatio = 1 - positiveRatio - negativeRatio;
    
    let overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
    if (positiveRatio > 0.6) overallSentiment = 'positive';
    else if (negativeRatio > 0.6) overallSentiment = 'negative';
    else if (positiveRatio > 0.3 && negativeRatio > 0.3) overallSentiment = 'mixed';
    
    return {
      overall_sentiment: overallSentiment,
      confidence: Math.max(positiveRatio, negativeRatio, neutralRatio),
      emotional_tone: overallSentiment === 'positive' ? ['optimistic'] : 
                     overallSentiment === 'negative' ? ['concerned'] : ['neutral'],
      sentiment_distribution: {
        positive: positiveRatio,
        negative: negativeRatio,
        neutral: neutralRatio,
      },
    };
  }

  private async generateVisualizations(
    content: string,
    analysis: any,
    entities: EntityResult[],
    topics: TopicResult[]
  ): Promise<VisualizationData[]> {
    const visualizations: VisualizationData[] = [];
    
    // Topic frequency chart
    if (topics.length > 0) {
      visualizations.push({
        type: 'chart',
        title: 'Topic Frequency Analysis',
        data: {
          labels: topics.map(t => t.topic),
          datasets: [{
            label: 'Frequency',
            data: topics.map(t => t.frequency),
          }],
        },
        description: 'Most frequently mentioned topics in the document',
      });
    }
    
    // Entity distribution
    if (entities.length > 0) {
      const entityTypes = entities.reduce((acc, entity) => {
        acc[entity.type] = (acc[entity.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      visualizations.push({
        type: 'chart',
        title: 'Entity Type Distribution',
        data: {
          labels: Object.keys(entityTypes),
          datasets: [{
            label: 'Count',
            data: Object.values(entityTypes),
          }],
        },
        description: 'Distribution of different entity types found in the document',
      });
    }
    
    return visualizations;
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private detectLanguage(content: string): string {
    // Simple language detection (in production, use proper language detection)
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = content.toLowerCase().split(/\s+/).slice(0, 100);
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return englishCount > 5 ? 'en' : 'unknown';
  }

  private calculateReadabilityScore(content: string): number {
    // Simple Flesch Reading Ease approximation
    const sentences = content.split(/[.!?]+/).length;
    const words = this.countWords(content);
    const syllables = this.countSyllables(content);
    
    if (sentences === 0 || words === 0) return 0;
    
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    // Simple syllable counting
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.reduce((total, word) => {
      const syllables = word.match(/[aeiouy]+/g) || [];
      return total + Math.max(1, syllables.length);
    }, 0);
  }

  private calculateConfidenceScore(analysis: any): number {
    // Calculate overall confidence based on section confidences
    const sections = Object.values(analysis) as any[];
    const confidences = sections.map(section => section.confidence || 0.5);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  private formatSectionTitle(key: string): string {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private extractKeyPoints(content: string): string[] {
    // Extract key points from content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  private getContext(content: string, entity: string): string {
    const index = content.indexOf(entity);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + entity.length + 50);
    return content.substring(start, end);
  }
}

export const analysisFramework = new DocumentAnalysisFramework();