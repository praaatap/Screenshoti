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
  color,
  textColor,
  size = 'sm',
}) => {
  const display = label ?? (count !== undefined ? String(count) : '');
  if (!display) {return null;}

  const isSmall = size === 'sm';
  const bg = color ?? designTokens.color.text;
  const fg = textColor ?? designTokens.color.surface;

  return (
    <View style={[styles.badge, isSmall ? styles.sm : styles.md, {backgroundColor: bg}]}>
      <Text
        style={[
          isSmall ? designTokens.typography.caption : designTokens.typography.labelSmall,
          styles.text,
          {color: fg},
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
    borderRadius: designTokens.radius.full,
  },
  sm: {
    paddingHorizontal: designTokens.spacing.xs + 2,
    paddingVertical: designTokens.spacing.xxs,
    minWidth: 18,
  },
  md: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    minWidth: 24,
  },
  text: {
    textAlign: 'center',
  },
});
