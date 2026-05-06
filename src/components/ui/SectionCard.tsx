import React from 'react';
import {StyleSheet, Text, View, type ViewStyle} from 'react-native';
import type {AppTheme} from '../../types';
import {designTokens} from '../../theme/tokens';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  theme: AppTheme;
  style?: ViewStyle;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  title,
  theme,
  style,
  noPadding = false,
}) => {
  return (
    <View style={[styles.container, {borderColor: theme.colors.border}]}>
      {title && (
        <Text style={[styles.title, {color: theme.colors.muted}]}>{title.toUpperCase()}</Text>
      )}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          !noPadding && styles.cardPadding,
          style,
        ]}>
        {children}
      </View>
    </View>
  );
};

interface SectionRowProps {
  children: React.ReactNode;
  theme: AppTheme;
  isLast?: boolean;
}

export const SectionRow: React.FC<SectionRowProps> = ({children, theme, isLast = false}) => {
  return (
    <View
      style={[
        styles.row,
        !isLast && {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.lg,
  },
  title: {
    ...designTokens.typography.labelSmall,
    letterSpacing: 0.8,
    marginBottom: designTokens.spacing.xs,
    marginLeft: 2,
  },
  card: {
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPadding: {
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.lg,
  },
});
