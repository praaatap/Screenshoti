import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {designTokens} from '../../theme/tokens';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  count?: number;
  label?: string;
  color?: string;
  textColor?: string;
  size?: BadgeSize;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  label,
  color = designTokens.color.primary,
  textColor = '#ffffff',
  size = 'sm',
}) => {
  const display = label ?? (count !== undefined ? String(count) : '');
  if (!display) {return null;}

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          paddingHorizontal: isSmall ? designTokens.spacing.xs + 2 : designTokens.spacing.sm,
          paddingVertical: isSmall ? designTokens.spacing.xxs : designTokens.spacing.xs,
          borderRadius: designTokens.radius.full,
          minWidth: isSmall ? 18 : 24,
        },
      ]}>
      <Text
        style={[
          isSmall ? designTokens.typography.caption : designTokens.typography.labelSmall,
          {color: textColor, textAlign: 'center'},
        ]}>
        {display}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
