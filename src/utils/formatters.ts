// Utility functions for formatting data

/**
 * Format price to compact notation (e.g., 2500 → 2.5K, 1000000 → 1M)
 */
export function formatPrice(price: string | number): string {
  // Extract number from string like "₹2500" or "$50"
  const numStr = typeof price === 'string' ? price.replace(/[^\d.]/g, '') : price.toString();
  const num = parseFloat(numStr);
  
  if (isNaN(num)) return price.toString();
  
  // Get currency symbol if present
  const currencyMatch = typeof price === 'string' ? price.match(/[₹$€£¥]/)?.[0] : '';
  const currency = currencyMatch || '';
  
  // Format based on magnitude
  if (num >= 10000000) {
    return `${currency}${(num / 10000000).toFixed(1)}Cr`; // Crores
  } else if (num >= 100000) {
    return `${currency}${(num / 100000).toFixed(1)}L`; // Lakhs
  } else if (num >= 1000) {
    return `${currency}${(num / 1000).toFixed(1)}K`; // Thousands
  } else {
    return `${currency}${num}`;
  }
}

/**
 * Format large numbers to compact notation
 */
export function formatNumber(num: number): string {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1)}Cr`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

/**
 * Format review count (e.g., 35810 → 35.8K reviews)
 */
export function formatReviewCount(count: number): string {
  return `${formatNumber(count)} reviews`;
}
