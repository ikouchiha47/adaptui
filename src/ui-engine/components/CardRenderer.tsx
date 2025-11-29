// Card Renderer: Handles card component rendering
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UIComponent, UISchema } from '../../types/ui-schema';
import { formatPrice } from '../../utils/formatters';
import { PhotoGridVariant } from './PhotoGridVariant';

interface CardRendererProps {
  component: UIComponent;
  theme: UISchema['theme'];
  onPress?: () => void;
  combinedStyle: any;
}

export function CardRenderer({ component, theme, onPress, combinedStyle }: CardRendererProps) {
  const props = component.props as any;
  
  // Check if this is a destination card (has highlights array) or individual highlight card
  const isDestinationCard = props.highlights && Array.isArray(props.highlights);
  
  if (isDestinationCard) {
    return renderDestinationCard(props, theme, combinedStyle);
  }
  
  return renderHighlightCard(props, theme, combinedStyle, onPress);
}

function renderDestinationCard(props: any, theme: UISchema['theme'], combinedStyle: any) {
  const themeAny = theme as any;
  
  const cardStyle = {
    backgroundColor: themeAny.cardBg || theme.colors.surface,
    borderColor: themeAny.borderWidth > 2 ? theme.colors.text : `${theme.colors.primary}50`,
    borderWidth: themeAny.borderWidth || 2,
    borderRadius: themeAny.borderRadius || theme.borderRadius.md,
    shadowColor: themeAny.shadowColor || '#000000',
    shadowOffset: themeAny.shadowOffset || { width: 0, height: 4 },
    shadowOpacity: themeAny.shadowOpacity !== undefined ? themeAny.shadowOpacity : 0.3,
    shadowRadius: themeAny.shadowRadius !== undefined ? themeAny.shadowRadius : 8,
    elevation: themeAny.shadowRadius !== undefined ? themeAny.shadowRadius : 8,
  };
  
  // Aggregate photos from highlights if not provided at destination level
  let photoUrls = props.photoUrls;
  
  // 🔍 DETAILED PHOTO URL LOGGING
  console.log('📸 [CardRenderer] ========== START ==========');
  console.log('📸 [CardRenderer] Destination:', props.destination);
  console.log('📸 [CardRenderer] Props photoUrls:', props.photoUrls);
  console.log('📸 [CardRenderer] Highlights count:', props.highlights?.length || 0);
  
  if ((!photoUrls || photoUrls.length === 0) && props.highlights && props.highlights.length > 0) {
    // Collect photos from all highlights
    const allPhotos: string[] = [];
    for (const highlight of props.highlights) {
      console.log('📸 [CardRenderer] Processing highlight:', highlight.name);
      console.log('📸 [CardRenderer] Highlight photoUrls:', highlight.photoUrls);
      console.log('📸 [CardRenderer] Highlight photoUrl:', highlight.photoUrl);
      
      if (highlight.photoUrls && highlight.photoUrls.length > 0) {
        const photosToAdd = highlight.photoUrls.slice(0, 2);
        console.log('📸 [CardRenderer] Adding photoUrls:', photosToAdd);
        allPhotos.push(...photosToAdd);
      } else if (highlight.photoUrl) {
        console.log('📸 [CardRenderer] Adding photoUrl:', highlight.photoUrl);
        allPhotos.push(highlight.photoUrl);
      }
    }
    photoUrls = allPhotos.slice(0, 5); // Limit to 5 total photos
    console.log('📸 [CardRenderer] Final aggregated photoUrls:', photoUrls);
  }
  
  console.log('📸 [CardRenderer] Final photoUrls to pass:', photoUrls);
  console.log('📸 [CardRenderer] ========== END ==========');
  
  return (
    <View style={[styles.destinationCard, cardStyle, combinedStyle]}>
      {/* Photo grid */}
      {photoUrls && photoUrls.length > 0 && (
        <PhotoGridVariant 
          photos={photoUrls} 
          variant={props.photoGridVariant || 'horizontal'}
        />
      )}
      
      {/* Destination header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Ionicons name="location" size={20} color={theme.colors.primary} />
        <Text style={[styles.destinationName, { color: theme.colors.text }]}>
          {props.destination}
        </Text>
      </View>
      <Text style={[styles.destinationVibe, { color: theme.colors.textSecondary }]}>
        {props.vibe}
      </Text>
      
      {/* Best time badge */}
      {props.bestTime && isTimeOfDay(props.bestTime) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 4 }}>
          <Ionicons name={getTimeIcon(props.bestTime)} size={20} color={theme.colors.text} />
          <Text style={[styles.bestTimeText, { color: theme.colors.text }]}>
            Best Time: {capitalizeFirst(props.bestTime)}
          </Text>
        </View>
      )}
      
      {/* Top Experiences header */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Top Experiences
      </Text>
      
      {/* Highlights list */}
      <View style={styles.highlightsContainer}>
        {props.highlights.map((highlight: any, idx: number) => 
          renderHighlightItem(highlight, idx, theme, themeAny)
        )}
      </View>
      
      {/* Local Tip */}
      {props.localTip && (
        <View style={[styles.localTipBox, { 
          backgroundColor: themeAny.localTipBg || '#0F172A', 
          borderColor: themeAny.localTipBorder || '#6366F1',
          borderRadius: themeAny.borderRadius || 12,
        }]}>
          <Text style={[styles.localTipLabel, { color: themeAny.localTipLabel || '#6366F1' }]}>💡 Local Tip</Text>
          <Text style={[styles.localTipText, { color: themeAny.localTipText || '#E2E8F0' }]}>
            {props.localTip}
          </Text>
        </View>
      )}
    </View>
  );
}

function renderHighlightItem(highlight: any, idx: number, theme: UISchema['theme'], themeAny: any) {
  const badges = themeAny.badges || {
    luxury: '#8B5CF6',
    budget: '#10B981',
    midrange: '#3B82F6',
    touristy: '#F59E0B',
    offbeat: '#EC4899',
    default: '#6366F1',
  };
  
  const badgeColor = highlight.type === 'luxury' ? badges.luxury :
                    highlight.type === 'budget' ? badges.budget :
                    highlight.type === 'mid-range' ? badges.midrange :
                    highlight.type === 'touristy' ? badges.touristy :
                    highlight.type === 'offbeat' ? badges.offbeat :
                    highlight.type === 'hidden-gem' ? badges.offbeat : badges.default;
  
  const MISSING_THEME_COLOR = '#FF00FF';
  const badgeBorderWidth = themeAny.badgeBorderWidth ?? themeAny.borderWidth ?? 1;
  const badgeBorderColor = themeAny.badgeStyle?.borderColor ?? MISSING_THEME_COLOR;
  const badgeBorderRadius = themeAny.borderRadius ?? 6;
  const badgeTextColor = themeAny.badgeStyle?.textColor ?? MISSING_THEME_COLOR;
  const priceIconColor = themeAny.badgeStyle?.priceIconColor ?? MISSING_THEME_COLOR;
  const ratingIconColor = themeAny.badgeStyle?.ratingIconColor ?? MISSING_THEME_COLOR;
  const openIconColor = themeAny.badgeStyle?.openIconColor ?? MISSING_THEME_COLOR;
  const successBgColor = (themeAny.semantic?.success ?? MISSING_THEME_COLOR) + '20';
  const errorBgColor = (themeAny.semantic?.error ?? MISSING_THEME_COLOR) + '20';
  
  const highlightStyle = {
    backgroundColor: themeAny.cardBg || theme.colors.surface,
    borderColor: themeAny.borderWidth > 2 ? theme.colors.text : theme.colors.border,
    borderWidth: themeAny.borderWidth || 1,
    borderLeftWidth: themeAny.borderWidth ? themeAny.borderWidth * 2 : 3,
    borderLeftColor: theme.colors.primary,
    borderRadius: themeAny.borderRadius || theme.borderRadius.md,
    shadowColor: themeAny.shadowColor || '#000000',
    shadowOffset: themeAny.shadowOffset ? { width: themeAny.shadowOffset.x / 2, height: themeAny.shadowOffset.y / 2 } : { width: 0, height: 2 },
    shadowOpacity: themeAny.shadowOpacity !== undefined ? themeAny.shadowOpacity : 0.2,
    shadowRadius: themeAny.shadowRadius !== undefined ? themeAny.shadowRadius : 4,
    elevation: themeAny.shadowRadius !== undefined ? themeAny.shadowRadius : 4,
  };
  
  return (
    <View key={idx} style={[styles.highlightCard, highlightStyle]}>
      <Text style={[styles.highlightName, { color: theme.colors.text }]}>
        {highlight.name}
      </Text>
      
      <Text style={[styles.highlightDesc, { color: theme.colors.textSecondary }]}>
        {highlight.description}
      </Text>
      
      <View style={styles.highlightBadgesRow}>
        {renderTypeBadge(highlight.type, badgeColor, badgeBorderWidth, badgeBorderColor, badgeBorderRadius, badgeTextColor, themeAny)}
        {highlight.estimatedCost && renderCostBadge(highlight.estimatedCost, theme, badgeBorderWidth, badgeBorderColor, badgeBorderRadius, badgeTextColor, priceIconColor, themeAny)}
        {highlight.rating && renderRatingBadge(highlight.rating, theme, badgeBorderWidth, badgeBorderColor, badgeBorderRadius, badgeTextColor, ratingIconColor, themeAny)}
        {highlight.isOpen !== undefined && renderOpenBadge(highlight.isOpen, badgeBorderWidth, badgeBorderColor, badgeBorderRadius, badgeTextColor, openIconColor, successBgColor, errorBgColor, themeAny)}
      </View>
    </View>
  );
}

function renderTypeBadge(type: string, badgeColor: string, borderWidth: number, borderColor: string, borderRadius: number, textColor: string, themeAny: any) {
  return (
    <View style={[styles.typeBadge, { 
      backgroundColor: badgeColor,
      borderWidth,
      borderColor: '#000000',
      borderRadius,
    }]}>
      <Text style={[styles.typeText, { color: textColor }]}>{type.toUpperCase()}</Text>
    </View>
  );
}

function renderCostBadge(cost: any, theme: UISchema['theme'], borderWidth: number, borderColor: string, borderRadius: number, textColor: string, iconColor: string, themeAny: any) {
  return (
    <View style={[styles.infoBadge, { 
      backgroundColor: theme.colors.surface,
      borderWidth,
      borderColor: '#000000',
      borderRadius,
    }]}>
      <Ionicons name="cash-outline" size={12} color={iconColor} />
      <Text style={[styles.infoBadgeText, { color: textColor }]}>
        {formatPrice(cost)}
      </Text>
    </View>
  );
}

function renderRatingBadge(rating: number, theme: UISchema['theme'], borderWidth: number, borderColor: string, borderRadius: number, textColor: string, iconColor: string, themeAny: any) {
  return (
    <View style={[styles.infoBadge, { 
      backgroundColor: theme.colors.surface,
      borderWidth,
      borderColor: '#000000',
      borderRadius,
    }]}>
      <Ionicons name="star" size={12} color={iconColor} />
      <Text style={[styles.infoBadgeText, { color: textColor }]}>{rating}</Text>
    </View>
  );
}

function renderOpenBadge(isOpen: boolean, borderWidth: number, borderColor: string, borderRadius: number, textColor: string, iconColor: string, successBg: string, errorBg: string, themeAny: any) {
  return (
    <View style={[styles.infoBadge, { 
      backgroundColor: isOpen ? successBg : errorBg,
      borderWidth,
      borderColor: '#000000',
      borderRadius,
    }]}>
      <Ionicons 
        name={isOpen ? "checkmark-circle" : "close-circle"} 
        size={12} 
        color={iconColor} 
      />
      <Text style={[styles.infoBadgeText, { color: textColor }]}>
        {isOpen ? "Open" : "Closed"}
      </Text>
    </View>
  );
}

function renderHighlightCard(props: any, theme: UISchema['theme'], combinedStyle: any, onPress?: () => void) {
  const categoryType = props.type || props.category || 'general';
  const badgeColor = categoryType === 'luxury' ? '#8B5CF6' :
                    categoryType === 'budget' ? '#10B981' :
                    categoryType === 'touristy' ? '#F59E0B' :
                    categoryType === 'offbeat' ? '#EC4899' : '#6366F1';
  
  const [imageError, setImageError] = React.useState(false);
  const photoUrl = props.photoUrl || props.image;
  
  return (
    <TouchableOpacity
      style={[styles.experienceCard, combinedStyle]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {photoUrl && !imageError && (
        <Image 
          source={{ uri: photoUrl }} 
          style={styles.cardPhoto}
          resizeMode="cover"
          onError={(e) => {
            console.warn(`❌ [CardRenderer] Image failed to load: ${photoUrl.substring(0, 100)}...`, e.nativeEvent.error);
            setImageError(true);
          }}
          onLoad={() => {
            console.log(`✅ [CardRenderer] Image loaded successfully: ${photoUrl.substring(0, 100)}...`);
          }}
        />
      )}
      {photoUrl && imageError && (
        <View style={[styles.cardPhoto, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="image-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8, fontSize: 12 }}>
            Image unavailable
          </Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.categoryText}>{categoryType.toUpperCase()}</Text>
        </View>
        {(props.price || props.priceRange || props.estimatedCost) && (
          <Text style={[styles.priceText, { color: '#10B981' }]}>
            {formatPrice(props.price || props.priceRange || props.estimatedCost)}
          </Text>
        )}
      </View>
      {(props.title || props.name || props.destination) && (
        <Text style={[styles.experienceName, { color: theme.colors.text }]}>
          {props.title || props.name || props.destination}
        </Text>
      )}
      {props.description && (
        <Text style={[styles.experienceDesc, { color: theme.colors.textSecondary }]}>
          {props.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// Helper functions
function getTimeIcon(time: string): any {
  const timeLower = time.toLowerCase();
  if (timeLower.includes('morning') || timeLower.includes('dawn') || timeLower.includes('sunrise')) return 'sunny-outline';
  if (timeLower.includes('afternoon') || timeLower.includes('noon')) return 'sunny';
  if (timeLower.includes('evening') || timeLower.includes('sunset') || timeLower.includes('dusk')) return 'partly-sunny-outline';
  if (timeLower.includes('night') || timeLower.includes('midnight')) return 'moon-outline';
  return 'calendar-outline';
}

function isTimeOfDay(time: string): boolean {
  const timeLower = time.toLowerCase();
  const timeOfDayKeywords = ['morning', 'afternoon', 'evening', 'night', 'dawn', 'dusk', 'sunrise', 'sunset', 'noon', 'midnight'];
  return timeOfDayKeywords.some(keyword => timeLower.includes(keyword));
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  destinationCard: {
    padding: 20,
    marginBottom: 24,
  },
  destinationName: {
    fontSize: 20,
    fontWeight: '700',
  },
  destinationVibe: {
    fontSize: 14,
    marginBottom: 16,
  },
  bestTimeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  highlightsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  highlightName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  highlightDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  highlightBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  localTipBox: {
    padding: 16,
    borderWidth: 2,
  },
  localTipLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  localTipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  experienceCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardPhoto: {
    width: '100%',
    height: 180,
    backgroundColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 12,
    marginHorizontal: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFF',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  experienceName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginHorizontal: 16,
  },
  experienceDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginHorizontal: 16,
  },
});
