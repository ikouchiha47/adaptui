// Price formatter - converts long price descriptions to short format

export class PriceFormatter {
  /**
   * Format price to short format with max 25 characters
   * Examples:
   * - "$50/person" (10 chars)
   * - "$100/couple" (11 chars)
   * - "Free to browse" (14 chars)
   * - "$25/hour" (8 chars)
   */
  static format(price: string): string {
    if (!price) return 'N/A';

    // Already short format
    if (price.length <= 25) {
      return price;
    }

    // Normalize the price string
    const normalized = price.toLowerCase().trim();

    // Handle "per couple" variations
    if (normalized.includes('couple')) {
      const match = normalized.match(/\$?(\d+(?:\.\d{2})?)/);
      if (match) {
        return `$${match[1]}/couple`;
      }
    }

    // Handle "per person" variations
    if (normalized.includes('person')) {
      const match = normalized.match(/\$?(\d+(?:\.\d{2})?)/);
      if (match) {
        return `$${match[1]}/person`;
      }
    }

    // Handle "per day" variations
    if (normalized.includes('day')) {
      const match = normalized.match(/\$?(\d+(?:\.\d{2})?)/);
      if (match) {
        return `$${match[1]}/day`;
      }
    }

    // Handle "per hour" variations
    if (normalized.includes('hour')) {
      const match = normalized.match(/\$?(\d+(?:\.\d{2})?)/);
      if (match) {
        return `$${match[1]}/hour`;
      }
    }

    // Handle "free" variations
    if (normalized.includes('free')) {
      if (normalized.includes('browse')) {
        return 'Free to browse';
      }
      return 'Free';
    }

    // Handle "minimum spend" - extract the amount
    if (normalized.includes('minimum')) {
      const match = normalized.match(/\$?(\d+(?:\.\d{2})?)/);
      if (match) {
        if (normalized.includes('day')) {
          return `$${match[1]}/day min`;
        }
        return `$${match[1]} min`;
      }
    }

    // Fallback: try to extract first number and unit
    const match = normalized.match(/\$?(\d+(?:\.\d{2})?)\s*\/\s*(\w+)/);
    if (match) {
      return `$${match[1]}/${match[2]}`;
    }

    // Last resort: just truncate to 25 chars
    return price.substring(0, 25).trim();
  }

  /**
   * Validate price format
   */
  static isValid(price: string): boolean {
    if (!price) return false;
    
    const formatted = this.format(price);
    return formatted.length <= 25;
  }

  /**
   * Get price unit (person, couple, day, hour, etc.)
   */
  static getUnit(price: string): string {
    const normalized = price.toLowerCase();
    
    if (normalized.includes('couple')) return 'couple';
    if (normalized.includes('person')) return 'person';
    if (normalized.includes('day')) return 'day';
    if (normalized.includes('hour')) return 'hour';
    if (normalized.includes('free')) return 'free';
    
    return 'unknown';
  }
}
