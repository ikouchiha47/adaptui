declare module 'wink-sentiment' {
  interface SentimentResult {
    score: number;
    normalizedScore: number;
    tokenizedPhrase: string[];
  }
  
  function sentiment(text: string): SentimentResult;
  export = sentiment;
}
