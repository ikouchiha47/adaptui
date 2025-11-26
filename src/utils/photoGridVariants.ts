// Photo Grid Variant Selection

/**
 * Randomly select a photo grid variant based on photo count and context
 */
export function selectPhotoGridVariant(
  photoCount: number,
  context?: {
    placeType?: string;
    userIntent?: string;
    isHighlighted?: boolean;
  }
): 'horizontal' | 'split' | 'masonry' {
  // Need at least 3 photos for variant layouts
  if (photoCount < 3) {
    return 'horizontal';
  }

  // Weight different variants based on context
  const weights = {
    horizontal: 40, // Default layout
    split: 35,      // 1 large + 2 small (good for showcasing main photo)
    masonry: 25     // 2 small + 1 large (good for variety)
  };

  // Adjust weights based on context
  if (context?.placeType === 'restaurant' || context?.userIntent === 'romantic') {
    // For restaurants/romantic places, prefer split layout to highlight main photo
    weights.split = 50;
    weights.horizontal = 30;
    weights.masonry = 20;
  }

  if (context?.placeType === 'tourist_attraction' || context?.placeType === 'temple') {
    // For attractions, prefer masonry for visual variety
    weights.masonry = 45;
    weights.split = 35;
    weights.horizontal = 20;
  }

  if (context?.isHighlighted) {
    // For highlighted places, prefer more dynamic layouts
    weights.horizontal = 20;
    weights.split = 40;
    weights.masonry = 40;
  }

  // Weighted random selection
  const totalWeight = weights.horizontal + weights.split + weights.masonry;
  const random = Math.random() * totalWeight;

  if (random < weights.horizontal) {
    return 'horizontal';
  } else if (random < weights.horizontal + weights.split) {
    return 'split';
  } else {
    return 'masonry';
  }
}

/**
 * Get variant description for debugging
 */
export function getVariantDescription(variant: string): string {
  switch (variant) {
    case 'horizontal':
      return '3 equal photos side by side';
    case 'split':
      return '1 large photo + 2 stacked small photos';
    case 'masonry':
      return '2 stacked small photos + 1 large photo';
    default:
      return 'Unknown variant';
  }
}
