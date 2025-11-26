import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TransportTicket } from '../services/TransportService';

interface TicketCardProps {
  ticket: TransportTicket;
  theme: any;
  onPress?: () => void;
}

export function TicketCard({ ticket, theme, onPress }: TicketCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flight':
        return '#3B82F6'; // Blue
      case 'bus':
        return '#F59E0B'; // Amber
      case 'train':
        return '#10B981'; // Green
      default:
        return '#6366F1'; // Indigo
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return '✈️';
      case 'bus':
        return '🚌';
      case 'train':
        return '🚂';
      default:
        return '🚀';
    }
  };

  const typeColor = getTypeColor(ticket.type);

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: typeColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with type and price */}
      <View style={styles.header}>
        <View style={styles.typeSection}>
          <Text style={styles.typeIcon}>{getTypeIcon(ticket.type)}</Text>
          <View>
            <Text style={[styles.provider, { color: theme.text }]}>
              {ticket.provider}
            </Text>
            <Text style={[styles.type, { color: typeColor }]}>
              {ticket.type.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: typeColor }]}>
            ${ticket.price}
          </Text>
          <Text style={[styles.currency, { color: theme.text, opacity: 0.7 }]}>
            {ticket.currency}
          </Text>
        </View>
      </View>

      {/* Route and times */}
      <View style={styles.routeSection}>
        <View style={styles.timeBlock}>
          <Text style={[styles.time, { color: theme.text }]}>
            {ticket.departureTime}
          </Text>
          <Text style={[styles.location, { color: theme.text, opacity: 0.7 }]}>
            {ticket.from}
          </Text>
        </View>

        <View style={styles.durationBlock}>
          <View style={[styles.durationLine, { backgroundColor: typeColor }]} />
          <Text style={[styles.duration, { color: theme.text, opacity: 0.7 }]}>
            {ticket.duration}
          </Text>
          {ticket.stops && (
            <Text style={[styles.stops, { color: theme.text, opacity: 0.6 }]}>
              {ticket.stops} stops
            </Text>
          )}
        </View>

        <View style={styles.timeBlock}>
          <Text style={[styles.time, { color: theme.text }]}>
            {ticket.arrivalTime}
          </Text>
          <Text style={[styles.location, { color: theme.text, opacity: 0.7 }]}>
            {ticket.to}
          </Text>
        </View>
      </View>

      {/* Footer with seats and distance */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: theme.text, opacity: 0.7 }]}>
            Seats
          </Text>
          <Text style={[styles.footerValue, { color: theme.text }]}>
            {ticket.seats} available
          </Text>
        </View>

        {ticket.distance && (
          <View style={styles.footerItem}>
            <Text style={[styles.footerLabel, { color: theme.text, opacity: 0.7 }]}>
              Distance
            </Text>
            <Text style={[styles.footerValue, { color: theme.text }]}>
              {ticket.distance} km
            </Text>
          </View>
        )}

        <View style={[styles.bookButton, { backgroundColor: typeColor }]}>
          <Text style={styles.bookButtonText}>Book</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  typeIcon: {
    fontSize: 32,
  },
  provider: {
    fontSize: 16,
    fontFamily: 'Orbitron_600SemiBold',
  },
  type: {
    fontSize: 12,
    fontFamily: 'Orbitron_500Medium',
    marginTop: 2,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontFamily: 'Orbitron_700Bold',
  },
  currency: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
  },
  routeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontFamily: 'Orbitron_700Bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
  },
  durationBlock: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  durationLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Orbitron_500Medium',
  },
  stops: {
    fontSize: 11,
    fontFamily: 'Orbitron_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 11,
    fontFamily: 'Orbitron_400Regular',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 13,
    fontFamily: 'Orbitron_600SemiBold',
  },
  bookButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Orbitron_600SemiBold',
  },
});
