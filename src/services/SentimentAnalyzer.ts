/**
 * Sentiment Analysis Service using Wink NLP (React Native compatible)
 * 
 * Analyzes text sentiment for place reviews and descriptions
 * Uses wink-nlp with wink-sentiment
 */

import model from 'wink-eng-lite-web-model';
import winkNLP from 'wink-nlp';
import sentiment from 'wink-sentiment';

export interface SentimentResult {
  score: number; // -1 to 1 (negative to positive)
  classification: 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive';
  confidence: number; // 0 to 1
  normalizedScore: number; // Wink's normalized score
}

export class SentimentAnalyzer {
  private nlp: any;

  constructor() {
    // Initialize wink-nlp with English model
    this.nlp = winkNLP(model);
  }

  /**
   * Analyze sentiment of text
   * Returns score from -1 (very negative) to 1 (very positive)
   */
  analyze(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        classification: 'neutral',
        confidence: 0,
        normalizedScore: 0
      };
    }

    try {
      // Get sentiment using wink-sentiment
      const result = sentiment(text);
      
      // Wink returns: { score, normalizedScore, tokenizedPhrase }
      // normalizedScore is already -1 to 1
      const normalizedScore = result.normalizedScore || 0;
      
      // Calculate confidence based on absolute score
      const confidence = Math.min(1, Math.abs(normalizedScore) * 2);
      
      // Classify sentiment
      const classification = this.classifySentiment(normalizedScore);

      return {
        score: normalizedScore,
        classification,
        confidence,
        normalizedScore: result.normalizedScore
      };
    } catch (error) {
      console.error('[SentimentAnalyzer] Error:', error);
      return {
        score: 0,
        classification: 'neutral',
        confidence: 0,
        normalizedScore: 0
      };
    }
  }

  /**
   * Analyze sentiment of multiple texts and return average
   */
  analyzeMultiple(texts: string[]): SentimentResult {
    if (!texts || texts.length === 0) {
      return {
        score: 0,
        classification: 'neutral',
        confidence: 0,
        normalizedScore: 0
      };
    }

    const results = texts.map(text => this.analyze(text));
    
    // Calculate weighted average based on confidence
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const weightedScore = results.reduce((sum, r) => sum + (r.score * r.confidence), 0) / (totalConfidence || 1);
    
    // Average confidence
    const avgConfidence = totalConfidence / results.length;

    return {
      score: weightedScore,
      classification: this.classifySentiment(weightedScore),
      confidence: avgConfidence,
      normalizedScore: weightedScore
    };
  }

  /**
   * Classify sentiment score into categories
   */
  private classifySentiment(score: number): 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive' {
    if (score <= -0.6) return 'very negative';
    if (score <= -0.2) return 'negative';
    if (score >= 0.6) return 'very positive';
    if (score >= 0.2) return 'positive';
    return 'neutral';
  }

  /**
   * Extract sentiment keywords from text
   * Returns words that contributed most to sentiment
   */
  extractSentimentKeywords(text: string, limit: number = 10): Array<{ word: string; sentiment: 'positive' | 'negative' }> {
    if (!text || text.trim().length === 0) return [];

    try {
      // Tokenize and analyze
      const doc = this.nlp.readDoc(text);
      const tokens = doc.tokens().out();
      
      // Get sentiment for each token
      const tokenSentiments = tokens.map((token: string) => {
        const result = sentiment(token);
        return { word: token, score: result.normalizedScore || 0 };
      });

      // Filter and sort by absolute score
      const keywords = tokenSentiments
        .filter((t: any) => Math.abs(t.score) > 0.1)
        .sort((a: any, b: any) => Math.abs(b.score) - Math.abs(a.score))
        .slice(0, limit)
        .map((t: any) => ({
          word: t.word,
          sentiment: t.score > 0 ? 'positive' as const : 'negative' as const
        }));

      return keywords;
    } catch (error) {
      console.error('[SentimentAnalyzer] Extract keywords error:', error);
      return [];
    }
  }

  /**
   * Analyze crowd-related sentiment
   * Specifically looks for crowd-level indicators
   */
  analyzeCrowdSentiment(text: string): {
    crowdLevel: 'quiet' | 'moderate' | 'busy' | 'very busy';
    sentiment: SentimentResult;
    crowdKeywords: string[];
  } {
    const sentimentResult = this.analyze(text);
    
    // Extract crowd-related keywords
    const crowdKeywords = [
      'crowded', 'packed', 'busy', 'full', 'wait', 'line', 'queue',
      'quiet', 'empty', 'peaceful', 'calm', 'serene', 'uncrowded',
      'moderate', 'manageable', 'reasonable'
    ];
    
    const foundKeywords = crowdKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );

    // Determine crowd level from keywords
    const busyWords = ['crowded', 'packed', 'busy', 'full', 'wait', 'line', 'queue'];
    const quietWords = ['quiet', 'empty', 'peaceful', 'calm', 'serene', 'uncrowded'];
    
    const busyCount = foundKeywords.filter(k => busyWords.includes(k)).length;
    const quietCount = foundKeywords.filter(k => quietWords.includes(k)).length;
    
    let crowdLevel: 'quiet' | 'moderate' | 'busy' | 'very busy';
    
    if (busyCount > quietCount + 2) {
      crowdLevel = 'very busy';
    } else if (busyCount > quietCount) {
      crowdLevel = 'busy';
    } else if (quietCount > busyCount) {
      crowdLevel = 'quiet';
    } else {
      crowdLevel = 'moderate';
    }

    return {
      crowdLevel,
      sentiment: sentimentResult,
      crowdKeywords: foundKeywords
    };
  }

  /**
   * Compare sentiment between two texts
   */
  compare(text1: string, text2: string): {
    text1: SentimentResult;
    text2: SentimentResult;
    difference: number;
    morePositive: 'text1' | 'text2' | 'equal';
  } {
    const result1 = this.analyze(text1);
    const result2 = this.analyze(text2);
    const difference = result1.score - result2.score;

    return {
      text1: result1,
      text2: result2,
      difference,
      morePositive: difference > 0.1 ? 'text1' : difference < -0.1 ? 'text2' : 'equal'
    };
  }
}

// Singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();
