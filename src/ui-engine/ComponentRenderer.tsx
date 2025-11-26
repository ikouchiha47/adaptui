// Component Renderer: Converts UI Schema to React Native components

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { UIComponent, UISchema } from '../types/ui-schema';
import { formatPrice } from '../utils/formatters';

interface ComponentRendererProps {
  schema: UISchema;
  onAction?: (actionId: string, params?: any) => void;
}

export function ComponentRenderer({ schema, onAction }: ComponentRendererProps) {
  const handleAction = (actionId?: string, params?: any) => {
    if (!actionId) return;
    
    const action = schema.actions?.[actionId];
    if (action && onAction) {
      onAction(actionId, { ...action.params, ...params });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: schema.theme.colors.background }]}>
      {schema.components.map((component) => (
        <RenderComponent
          key={component.id}
          component={component}
          theme={schema.theme}
          onAction={handleAction}
        />
      ))}
    </View>
  );
}

interface RenderComponentProps {
  component: UIComponent;
  theme: UISchema['theme'];
  onAction: (actionId?: string, params?: any) => void;
  data?: any;
}

function RenderComponent({ component, theme, onAction, data }: RenderComponentProps) {
  // Convert schema layout to React Native style
  const layoutStyle = convertLayoutToStyle(component.layout);
  const customStyle = convertStyleToRN(component.style);
  const combinedStyle = { ...layoutStyle, ...customStyle };
  
  // Cast props to any for flexibility with registry components
  // Merge data into props if provided (for list items)
  const props = data ? { ...component.props, ...data } : component.props as any;

  // Handle haptic feedback
  const handlePress = () => {
    if (component.interaction?.hapticFeedback) {
      const feedbackMap: Record<string, any> = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(feedbackMap[component.interaction.hapticFeedback] || Haptics.ImpactFeedbackStyle.Medium);
    }
    onAction(component.interaction?.onPress, data);
  };

  switch (component.type as any) {
    case 'text':
      return (
        <Text style={[combinedStyle, convertTypographyToStyle(component.style?.typography)]}>
          {props.text}
        </Text>
      );

    case 'input':
      return (
        <View style={[styles.inputContainer, combinedStyle]}>
          {props.icon && props.iconPosition === 'left' && (
            <Ionicons name={props.icon as any} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          )}
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={props.placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={props.value}
            multiline={props.multiline}
            maxLength={props.maxLength}
            keyboardType={props.keyboardType}
            autoCapitalize={props.autoCapitalize}
            autoCorrect={props.autoCorrect}
            secureTextEntry={props.secureTextEntry}
          />
          {props.icon && props.iconPosition === 'right' && (
            <Ionicons name={props.icon as any} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          )}
        </View>
      );

    case 'button':
      const isDisabled = component.interaction?.disabled || component.interaction?.loading;
      return (
        <TouchableOpacity
          style={[styles.button, combinedStyle, isDisabled && styles.buttonDisabled]}
          onPress={handlePress}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          {component.interaction?.loading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <>
              {props.icon && props.iconPosition === 'left' && (
                <Ionicons name={props.icon as any} size={20} color={theme.colors.text} style={{ marginRight: 8 }} />
              )}
              {props.text && (
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                  {props.text}
                </Text>
              )}
              {props.icon && (!props.iconPosition || props.iconPosition === 'right') && (
                <Ionicons name={props.icon as any} size={20} color={theme.colors.text} style={{ marginLeft: 8 }} />
              )}
            </>
          )}
        </TouchableOpacity>
      );

    case 'card':
      // Check if this is a destination card (has highlights array) or individual highlight card
      const isDestinationCard = props.highlights && Array.isArray(props.highlights);
      
      if (isDestinationCard) {
        // Render full destination card (like static UI)
        return (
          <View style={[styles.destinationCard, combinedStyle]}>
            {/* Photo grid with variant layouts */}
            {props.photoUrls && props.photoUrls.length > 0 && (
              <PhotoGridVariant 
                photos={props.photoUrls} 
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
            
            {/* Best time badge - aligned with location icon */}
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
              {props.highlights.map((highlight: any, idx: number) => {
                const badgeColor = highlight.type === 'luxury' ? '#8B5CF6' :
                                  highlight.type === 'budget' ? '#10B981' :
                                  highlight.type === 'touristy' ? '#F59E0B' :
                                  highlight.type === 'hidden-gem' ? '#EC4899' : '#6366F1';
                
                return (
                  <View key={idx} style={[styles.highlightCard, { backgroundColor: '#0F172A', borderColor: '#334155' }]}>
                    {/* Title */}
                    <Text style={[styles.highlightName, { color: theme.colors.text }]}>
                      {highlight.name}
                    </Text>
                    
                    {/* Description */}
                    <Text style={[styles.highlightDesc, { color: theme.colors.textSecondary }]}>
                      {highlight.description}
                    </Text>
                    
                    {/* Badges row: Type, Cost, Rating, Hours */}
                    <View style={styles.highlightBadgesRow}>
                      {/* Type badge */}
                      <View style={[styles.typeBadge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.typeText}>{highlight.type.toUpperCase()}</Text>
                      </View>
                      
                      {/* Cost */}
                      {highlight.estimatedCost && (
                        <View style={[styles.infoBadge, { backgroundColor: theme.colors.surface }]}>
                          <Ionicons name="cash-outline" size={12} color="#10B981" />
                          <Text style={[styles.infoBadgeText, { color: '#10B981' }]}>
                            {formatPrice(highlight.estimatedCost)}
                          </Text>
                        </View>
                      )}
                      
                      {/* Rating */}
                      {highlight.rating && (
                        <View style={[styles.infoBadge, { backgroundColor: theme.colors.surface }]}>
                          <Ionicons name="thumbs-up" size={12} color="#F59E0B" />
                          <Text style={[styles.infoBadgeText, { color: '#F59E0B' }]}>
                            {highlight.rating}
                          </Text>
                        </View>
                      )}
                      
                      {/* Opening hours */}
                      {highlight.isOpen !== undefined && (
                        <View style={[styles.infoBadge, { backgroundColor: theme.colors.surface }]}>
                          <Ionicons 
                            name={highlight.isOpen ? "checkmark-circle" : "close-circle"} 
                            size={12} 
                            color={highlight.isOpen ? "#10B981" : "#EF4444"} 
                          />
                          <Text style={[styles.infoBadgeText, { color: highlight.isOpen ? "#10B981" : "#EF4444" }]}>
                            {highlight.isOpen ? "Open" : "Closed"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            
            {/* Local Tip */}
            {props.localTip && (
              <View style={[styles.localTipBox, { backgroundColor: '#0F172A', borderColor: '#6366F1' }]}>
                <Text style={[styles.localTipLabel, { color: '#6366F1' }]}>💡 Local Tip</Text>
                <Text style={[styles.localTipText, { color: '#E2E8F0' }]}>
                  {props.localTip}
                </Text>
              </View>
            )}
          </View>
        );
      }
      
      // Individual highlight card (fallback)
      const categoryType = props.type || props.category || 'general';
      const badgeColor = categoryType === 'luxury' ? '#8B5CF6' :
                        categoryType === 'budget' ? '#10B981' :
                        categoryType === 'touristy' ? '#F59E0B' :
                        categoryType === 'offbeat' ? '#EC4899' : '#6366F1';
      
      return (
        <TouchableOpacity
          style={[styles.experienceCard, combinedStyle]}
          onPress={component.interaction?.onPress ? handlePress : undefined}
          activeOpacity={component.interaction?.onPress ? 0.8 : 1}
        >
          {(props.photoUrl || props.image) && (
            <Image 
              source={{ uri: props.photoUrl || props.image }} 
              style={styles.cardPhoto}
              resizeMode="cover"
            />
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

    case 'list':
      if (props.loading) {
        return <ActivityIndicator size="large" color={theme.colors.primary} style={combinedStyle} />;
      }
      return (
        <FlatList
          data={props.items}
          renderItem={({ item }) => (
            component.children?.[0] ? (
              <RenderComponent
                component={component.children[0]}
                theme={theme}
                onAction={onAction}
                data={item}
              />
            ) : null
          )}
          ItemSeparatorComponent={props.separator ? () => <View style={{ height: 1, backgroundColor: theme.colors.border }} /> : undefined}
          ListEmptyComponent={
            props.emptyMessage ? (
              <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 20 }}>
                {props.emptyMessage}
              </Text>
            ) : null
          }
          style={combinedStyle}
          nestedScrollEnabled={true}
          scrollEnabled={false}
        />
      );

    case 'chip-group':
      if (!props || !props.options) {
        console.warn('⚠️ [ComponentRenderer] chip-group missing options');
        return null;
      }
      return (
        <View style={[styles.chipGroup, styles.chipGroupContainer, combinedStyle]}>
          {props.options.map((option: any) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.chip,
                {
                  backgroundColor: props.variant === 'filled' ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.primary,
                  borderWidth: 1,
                },
              ]}
              onPress={() => handlePress()}
            >
              {option.icon && (
                <Ionicons name={option.icon as any} size={16} color={theme.colors.text} style={{ marginRight: 6 }} />
              )}
              <Text style={[styles.chipText, { color: theme.colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );

    case 'image':
      return (
        <Image
          source={{ uri: props.source }}
          style={[combinedStyle, { resizeMode: props.fit || 'cover' }]}
        />
      );

    case 'stack':
      return (
        <View style={[combinedStyle, { flexDirection: component.layout?.flexDirection || 'column' }]}>
          {component.children?.map((child) => (
            <RenderComponent key={child.id} component={child} theme={theme} onAction={onAction} />
          ))}
        </View>
      );

    case 'badge':
      return (
        <View style={[styles.badge, combinedStyle, { backgroundColor: theme.colors.surface }]}>
          {props.icon && (
            <Ionicons name={props.icon as any} size={16} color={theme.colors.text} style={{ marginRight: 4 }} />
          )}
          <Text style={[styles.badgeText, { color: theme.colors.text }]}>
            {props.label || props.text}
          </Text>
        </View>
      );

    case 'photo-grid':
      const photos = props.photos || [];
      if (photos.length === 0) return null;
      
      return (
        <View style={styles.photoGrid}>
          {photos[0] && (
            <Image source={{ uri: photos[0] }} style={styles.heroPhoto} />
          )}
          <View style={styles.photoThumbnails}>
            {photos.slice(1, 3).map((photo: string, idx: number) => (
              <Image key={idx} source={{ uri: photo }} style={styles.thumbnail} />
            ))}
            {photos.length > 3 && (
              <View style={styles.morePhotos}>
                <Text style={styles.morePhotosText}>+{photos.length - 3} more</Text>
              </View>
            )}
          </View>
        </View>
      );

    case 'transport-tickets':
      const tickets = props.tickets || [];
      if (tickets.length === 0) return null;
      
      return (
        <View style={styles.transportSection}>
          {tickets.map((ticket: any, idx: number) => (
            <View key={idx} style={[styles.ticketCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.ticketType, { color: theme.colors.primary }]}>
                {ticket.type?.toUpperCase()}
              </Text>
              <Text style={[styles.ticketRoute, { color: theme.colors.text }]}>
                {ticket.from} → {ticket.to}
              </Text>
              <Text style={[styles.ticketPrice, { color: '#10B981' }]}>
                {formatPrice(ticket.price)}
              </Text>
            </View>
          ))}
        </View>
      );

    default:
      console.warn(`⚠️ [ComponentRenderer] Unknown component type: ${component.type}`);
      return null;
  }
}

// Photo Grid Variant Component
function PhotoGridVariant({ photos, variant }: { photos: string[]; variant: 'horizontal' | 'split' | 'masonry' }) {
  const hasMore = photos.length > 3;
  
  if (variant === 'split' && photos.length >= 3) {
    // Split layout: 1 large left, 2 stacked right
    return (
      <View style={styles.photoGridSplit}>
        {/* Left: Large photo */}
        <View style={styles.photoGridLeft}>
          <Image 
            source={{ uri: photos[0] }} 
            style={styles.photoGridLarge}
            resizeMode="cover"
          />
        </View>
        
        {/* Right: Two stacked photos */}
        <View style={styles.photoGridRight}>
          <Image 
            source={{ uri: photos[1] }} 
            style={styles.photoGridSmall}
            resizeMode="cover"
          />
          <View style={styles.photoGridSmallContainer}>
            <Image 
              source={{ uri: photos[2] }} 
              style={styles.photoGridSmall}
              resizeMode="cover"
            />
            {hasMore && (
              <View style={styles.morePhotosOverlay}>
                <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
  
  if (variant === 'masonry' && photos.length >= 3) {
    // Masonry layout: 2 left stacked, 1 large right
    return (
      <View style={styles.photoGridSplit}>
        {/* Left: Two stacked photos */}
        <View style={styles.photoGridRight}>
          <Image 
            source={{ uri: photos[0] }} 
            style={styles.photoGridSmall}
            resizeMode="cover"
          />
          <Image 
            source={{ uri: photos[1] }} 
            style={styles.photoGridSmall}
            resizeMode="cover"
          />
        </View>
        
        {/* Right: Large photo */}
        <View style={styles.photoGridLeft}>
          <View style={styles.photoGridSmallContainer}>
            <Image 
              source={{ uri: photos[2] }} 
              style={styles.photoGridLarge}
              resizeMode="cover"
            />
            {hasMore && (
              <View style={styles.morePhotosOverlay}>
                <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
  
  // Default: Horizontal layout (3 equal photos)
  return (
    <View style={styles.destinationPhotoGrid}>
      {photos.slice(0, 3).map((url: string, idx: number) => {
        const isLast = idx === 2;
        
        if (isLast && hasMore) {
          return (
            <View key={idx} style={styles.destinationPhoto}>
              <Image 
                source={{ uri: url }} 
                style={styles.destinationPhotoImage}
                resizeMode="cover"
              />
              <View style={styles.morePhotosOverlay}>
                <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
              </View>
            </View>
          );
        }
        
        return (
          <Image 
            key={idx}
            source={{ uri: url }} 
            style={styles.destinationPhoto}
            resizeMode="cover"
          />
        );
      })}
    </View>
  );
}

// Helper functions for Ionicons
function getTimeIcon(time: string): any {
  const timeLower = time.toLowerCase();
  if (timeLower.includes('morning') || timeLower.includes('dawn') || timeLower.includes('sunrise')) return 'sunny-outline';
  if (timeLower.includes('afternoon') || timeLower.includes('noon')) return 'sunny';
  if (timeLower.includes('evening') || timeLower.includes('sunset') || timeLower.includes('dusk')) return 'partly-sunny-outline';
  if (timeLower.includes('night') || timeLower.includes('midnight')) return 'moon-outline';
  // For seasons/months, use calendar icon instead of clock
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

function getCrowdIcon(level: string): any {
  const levelLower = level.toLowerCase();
  if (levelLower.includes('quiet') || levelLower.includes('empty')) return 'person-outline';
  if (levelLower.includes('moderate')) return 'people-outline';
  if (levelLower.includes('busy') || levelLower.includes('crowded')) return 'people';
  return 'people-outline';
}

function getWeatherIcon(conditions: string): any {
  const condLower = conditions.toLowerCase();
  if (condLower.includes('clear') || condLower.includes('sunny')) return 'sunny';
  if (condLower.includes('partly') || condLower.includes('partial')) return 'partly-sunny';
  if (condLower.includes('cloud')) return 'cloudy';
  if (condLower.includes('rain')) return 'rainy';
  if (condLower.includes('storm')) return 'thunderstorm';
  return 'cloud-outline';
}

// Helper functions to convert schema to React Native styles
function convertLayoutToStyle(layout?: UIComponent['layout']): any {
  if (!layout) return {};

  const style: any = {};

  // Dimensions
  if (layout.width === 'fill') style.width = '100%';
  else if (layout.width) style.width = layout.width;
  
  if (layout.height === 'fill') style.height = '100%';
  else if (layout.height) style.height = layout.height;

  if (layout.minWidth) style.minWidth = layout.minWidth;
  if (layout.maxWidth) style.maxWidth = layout.maxWidth;
  if (layout.minHeight) style.minHeight = layout.minHeight;
  if (layout.maxHeight) style.maxHeight = layout.maxHeight;

  // Flexbox
  if (layout.flex) style.flex = layout.flex;
  if (layout.flexDirection) style.flexDirection = layout.flexDirection;
  if (layout.flexWrap) style.flexWrap = layout.flexWrap;
  if (layout.justifyContent) style.justifyContent = layout.justifyContent;
  if (layout.alignItems) style.alignItems = layout.alignItems;
  if (layout.alignSelf) style.alignSelf = layout.alignSelf;

  // Position
  if (layout.position) style.position = layout.position;
  if (layout.top !== undefined) style.top = layout.top;
  if (layout.right !== undefined) style.right = layout.right;
  if (layout.bottom !== undefined) style.bottom = layout.bottom;
  if (layout.left !== undefined) style.left = layout.left;
  if (layout.zIndex) style.zIndex = layout.zIndex;

  // Spacing
  if (layout.spacing) {
    const { padding, margin, gap } = layout.spacing;
    
    if (typeof padding === 'number') {
      style.padding = padding;
    } else if (padding) {
      if (padding.top !== undefined) style.paddingTop = padding.top;
      if (padding.right !== undefined) style.paddingRight = padding.right;
      if (padding.bottom !== undefined) style.paddingBottom = padding.bottom;
      if (padding.left !== undefined) style.paddingLeft = padding.left;
      if (padding.horizontal !== undefined) style.paddingHorizontal = padding.horizontal;
      if (padding.vertical !== undefined) style.paddingVertical = padding.vertical;
    }

    if (typeof margin === 'number') {
      style.margin = margin;
    } else if (margin) {
      if (margin.top !== undefined) style.marginTop = margin.top;
      if (margin.right !== undefined) style.marginRight = margin.right;
      if (margin.bottom !== undefined) style.marginBottom = margin.bottom;
      if (margin.left !== undefined) style.marginLeft = margin.left;
      if (margin.horizontal !== undefined) style.marginHorizontal = margin.horizontal;
      if (margin.vertical !== undefined) style.marginVertical = margin.vertical;
    }

    if (gap) style.gap = gap;
  }

  return style;
}

function convertStyleToRN(styleConfig?: UIComponent['style']): any {
  if (!styleConfig) return {};

  const style: any = {};

  if (styleConfig.backgroundColor) style.backgroundColor = styleConfig.backgroundColor;
  if (styleConfig.color) style.color = styleConfig.color;
  if (styleConfig.opacity !== undefined) style.opacity = styleConfig.opacity;

  // Border
  if (styleConfig.border) {
    if (styleConfig.border.width) style.borderWidth = styleConfig.border.width;
    if (styleConfig.border.color) style.borderColor = styleConfig.border.color;
    if (typeof styleConfig.border.radius === 'number') {
      style.borderRadius = styleConfig.border.radius;
    } else if (styleConfig.border.radius) {
      if (styleConfig.border.radius.topLeft) style.borderTopLeftRadius = styleConfig.border.radius.topLeft;
      if (styleConfig.border.radius.topRight) style.borderTopRightRadius = styleConfig.border.radius.topRight;
      if (styleConfig.border.radius.bottomLeft) style.borderBottomLeftRadius = styleConfig.border.radius.bottomLeft;
      if (styleConfig.border.radius.bottomRight) style.borderBottomRightRadius = styleConfig.border.radius.bottomRight;
    }
  }

  // Shadow
  if (styleConfig.shadow) {
    style.shadowColor = styleConfig.shadow.color || '#000';
    style.shadowOffset = styleConfig.shadow.offset || { width: 0, height: 2 };
    style.shadowOpacity = styleConfig.shadow.opacity || 0.25;
    style.shadowRadius = styleConfig.shadow.blur || 4;
    style.elevation = styleConfig.shadow.blur || 4; // Android
  }

  return style;
}

function convertTypographyToStyle(typography?: any): any {
  if (!typography) return {};

  return {
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeight,
    letterSpacing: typography.letterSpacing,
    textAlign: typography.textAlign,
    textTransform: typography.textTransform,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputIcon: {
    marginHorizontal: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  chipGroupContainer: {
    marginBottom: 24,
    maxWidth: '100%',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: 150,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Beautiful card styles matching TravelScreen
  destinationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    marginBottom: 24,
  },
  destinationPhotoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    height: 120,
  },
  destinationPhoto: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  destinationPhotoImage: {
    width: '100%',
    height: '100%',
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  destinationName: {
    fontSize: 20,
    fontWeight: '700',
  },
  destinationVibe: {
    fontSize: 14,
    marginBottom: 16,
  },
  bestTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: 4, // Small top margin for spacing from vibe text
  },
  bestTimeText: {
    fontSize: 14, // Increased from 13
    fontWeight: '600',
    letterSpacing: 0.3, // Better readability
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
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  localTipBox: {
    padding: 16,
    borderRadius: 12,
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
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  metaText: {
    fontSize: 12,
  },
  photoGrid: {
    marginBottom: 16,
  },
  heroPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  photoThumbnails: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnail: {
    flex: 1,
    height: 100,
    borderRadius: 8,
  },
  morePhotos: {
    flex: 1,
    height: 100,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportSection: {
    gap: 12,
    marginVertical: 16,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketType: {
    fontSize: 12,
    fontWeight: '700',
  },
  ticketRoute: {
    fontSize: 14,
    flex: 1,
    marginHorizontal: 12,
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  inlineBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Photo Grid Variant Styles
  photoGridSplit: {
    flexDirection: 'row',
    gap: 8,
    height: 200,
    marginBottom: 16,
  },
  photoGridLeft: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoGridRight: {
    flex: 1,
    gap: 8,
  },
  photoGridLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoGridSmall: {
    width: '100%',
    height: 96,
    borderRadius: 12,
  },
  photoGridSmallContainer: {
    position: 'relative',
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
