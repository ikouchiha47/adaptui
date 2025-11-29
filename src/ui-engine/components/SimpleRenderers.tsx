// Simple component renderers (text, image, badge, stack, etc.)
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { UIComponent, UISchema } from '../../types/ui-schema';
import { formatPrice } from '../../utils/formatters';

interface SimpleRendererProps {
  component: UIComponent;
  theme: UISchema['theme'];
  combinedStyle: any;
  typographyStyle?: any;
}

export function TextRenderer({ component, combinedStyle, typographyStyle }: SimpleRendererProps) {
  const props = component.props as any;
  return (
    <Text style={[combinedStyle, typographyStyle]}>
      {props.text}
    </Text>
  );
}

export function ImageRenderer({ component, combinedStyle }: SimpleRendererProps) {
  const props = component.props as any;
  return (
    <Image
      source={{ uri: props.source }}
      style={[combinedStyle, { resizeMode: props.fit || 'cover' }]}
    />
  );
}

export function BadgeRenderer({ component, theme, combinedStyle }: SimpleRendererProps) {
  const props = component.props as any;
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
}

interface StackRendererProps {
  component: UIComponent;
  combinedStyle: any;
  renderChild: (child: UIComponent) => React.ReactNode;
}

export function StackRenderer({ component, combinedStyle, renderChild }: StackRendererProps) {
  return (
    <View style={[combinedStyle, { flexDirection: component.layout?.flexDirection || 'column' }]}>
      {component.children?.map((child) => renderChild(child))}
    </View>
  );
}

interface PhotoGridSimpleProps {
  component: UIComponent;
}

export function PhotoGridRenderer({ component }: PhotoGridSimpleProps) {
  const props = component.props as any;
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
}

interface TransportTicketsProps {
  component: UIComponent;
  theme: UISchema['theme'];
}

export function TransportTicketsRenderer({ component, theme }: TransportTicketsProps) {
  const props = component.props as any;
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
}

const styles = StyleSheet.create({
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
  morePhotosText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
});
