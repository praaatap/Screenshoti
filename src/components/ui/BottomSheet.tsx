import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {FadeIn, FadeOut, SlideInDown, SlideOutDown} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {AppTheme} from '../../types';
import {designTokens} from '../../theme/tokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  theme,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.backdrop, {backgroundColor: theme.colors.scrim}]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(300).springify().damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            designTokens.elevation.high,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: insets.bottom + designTokens.spacing.lg,
            },
          ]}>
          <View style={styles.handleBar}>
            <View style={[styles.handle, {backgroundColor: theme.colors.outlineVariant}]} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: designTokens.radius.xxl,
    borderTopRightRadius: designTokens.radius.xxl,
    paddingHorizontal: designTokens.spacing.xxl,
    paddingTop: designTokens.spacing.sm,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
