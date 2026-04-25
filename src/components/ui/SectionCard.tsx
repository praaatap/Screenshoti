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
    <View style={styles.container}>
      {title && (
        <Text
          style={[
            designTokens.typography.labelMedium,
            {
              color: theme.colors.muted,
              marginBottom: designTokens.spacing.sm,
              marginLeft: designTokens.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            },
          ]}>
          {title}
        </Text>
      )}
      <View
        style={[
          styles.card,
          designTokens.elevation.low,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: designTokens.radius.lg,
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

export const SectionRow: React.FC<SectionRowProps> = ({
  children,
  theme,
  isLast = false,
}) => {
  return (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.lg,
  },
  card: {
    overflow: 'hidden',
  },
  cardPadding: {
    padding: designTokens.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: designTokens.spacing.md + 2,
    paddingHorizontal: designTokens.spacing.lg,
  },
});
