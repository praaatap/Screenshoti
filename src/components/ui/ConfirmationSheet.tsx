import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type {AppTheme} from '../../types';
import {designTokens} from '../../theme/tokens';
import {BottomSheet} from './BottomSheet';
import {Button} from './Button';

interface ConfirmationSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  theme: AppTheme;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: string;
}

export const ConfirmationSheet: React.FC<ConfirmationSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  theme,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon = 'alert-circle-outline',
}) => {
  const iconColor = variant === 'danger' ? theme.colors.danger : theme.colors.primary;

  return (
    <BottomSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor:
                variant === 'danger'
                  ? theme.colors.dangerContainer
                  : theme.colors.primaryContainer,
            },
          ]}>
          <MaterialCommunityIcons
            name={icon}
            size={designTokens.iconSize.lg}
            color={iconColor}
          />
        </View>

        <Text style={[designTokens.typography.titleLarge, {color: theme.colors.text, textAlign: 'center'}]}>
          {title}
        </Text>

        <Text
          style={[
            designTokens.typography.bodyMedium,
            {color: theme.colors.muted, textAlign: 'center'},
          ]}>
          {description}
        </Text>

        <View style={styles.actions}>
          <Button
            label={cancelLabel}
            variant="ghost"
            onPress={onClose}
            theme={theme}
            fullWidth
          />
          <Button
            label={confirmLabel}
            variant={variant}
            onPress={() => {
              onConfirm();
              onClose();
            }}
            theme={theme}
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: designTokens.spacing.md,
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginTop: designTokens.spacing.sm,
    width: '100%',
  },
});
