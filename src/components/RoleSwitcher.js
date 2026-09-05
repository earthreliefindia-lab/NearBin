import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';

export const ROLES = [
  { id: 'citizen', label: 'Citizen', icon: '👤', subtitle: 'Report & Upvote' },
  { id: 'worker', label: 'Govt Safai Mitra', icon: '🚜', subtitle: 'Clean & Proof' },
  { id: 'scrap', label: 'Kabadiwala / Scrap', icon: '♻️', subtitle: 'Claim Recyclables' },
  { id: 'admin', label: 'Nagar Nigam Admin', icon: '🏛️', subtitle: 'Overview & Stats' },
];

export default function RoleSwitcher({ currentRole, onSelectRole }) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>ACTIVE ROLE MODE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {ROLES.map((role) => {
          const isActive = currentRole === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelectRole(role.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{role.icon}</Text>
              <View>
                <Text style={[styles.title, isActive && styles.titleActive]}>{role.label}</Text>
                <Text style={styles.subtitle}>{role.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  titleActive: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
