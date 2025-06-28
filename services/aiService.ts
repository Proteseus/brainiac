export interface AIAnalysisRequest {
  content: string;
  provider: 'deepseek' | 'gemini';
  apiKey: string;
}

export interface AIAnalysisResult {
  summary: string;
  insights: string;
  recommendations: string;
  technical: string;
  fullReport: string;
}

export interface AIProgress {
  progress: number;
  message: string;
}

class AIService {
  private async callDeepSeekAPI(content: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert document analyst. Analyze the provided document and return a comprehensive analysis in the following JSON format:
            {
              "summary": "Executive summary (2-3 paragraphs)",
              "insights": "Detailed analytical insights and findings",
              "recommendations": "Actionable recommendations based on the analysis",
              "technical": "Technical details, code examples, or implementation notes",
              "fullReport": "Complete markdown-formatted comprehensive report"
            }`,
          },
          {
            role: 'user',
            content: `Please analyze this document:\n\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGeminiAPI(content: string, apiKey: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert document analyst. Analyze the provided document and return a comprehensive analysis in the following JSON format:
                {
                  "summary": "Executive summary (2-3 paragraphs)",
                  "insights": "Detailed analytical insights and findings", 
                  "recommendations": "Actionable recommendations based on the analysis",
                  "technical": "Technical details, code examples, or implementation notes",
                  "fullReport": "Complete markdown-formatted comprehensive report"
                }

                Document to analyze:
                ${content}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async analyzeDocument(
    request: AIAnalysisRequest,
    onProgress?: (progress: AIProgress) => void
  ): Promise<AIAnalysisResult> {
    try {
      onProgress?.({ progress: 10, message: 'Connecting to AI service...' });

      let response: string;
      
      if (request.provider === 'deepseek') {
        onProgress?.({ progress: 30, message: 'Analyzing with DeepSeek AI...' });
        response = await this.callDeepSeekAPI(request.content, request.apiKey);
      } else {
        onProgress?.({ progress: 30, message: 'Analyzing with Google Gemini...' });
        response = await this.callGeminiAPI(request.content, request.apiKey);
      }

      onProgress?.({ progress: 70, message: 'Processing analysis results...' });

      // Try to parse as JSON first
      let analysis: AIAnalysisResult;
      try {
        const parsed = JSON.parse(response);
        analysis = {
          summary: parsed.summary || 'No summary available',
          insights: parsed.insights || 'No insights available',
          recommendations: parsed.recommendations || 'No recommendations available',
          technical: parsed.technical || 'No technical details available',
          fullReport: parsed.fullReport || response,
        };
      } catch {
        // If not JSON, create structured response from text
        analysis = {
          summary: this.extractSection(response, 'summary') || 'Analysis completed successfully',
          insights: this.extractSection(response, 'insights') || response.substring(0, 500),
          recommendations: this.extractSection(response, 'recommendations') || 'See full report for recommendations',
          technical: this.extractSection(response, 'technical') || 'Technical analysis included in full report',
          fullReport: response,
        };
      }

      onProgress?.({ progress: 100, message: 'Analysis complete!' });
      return analysis;
    } catch (error) {
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractSection(text: string, section: string): string | null {
    const regex = new RegExp(`"${section}"\\s*:\\s*"([^"]*)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : null;
  }
}

export const aiService = new AIService();