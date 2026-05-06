import React, {useEffect} from 'react';
import {StyleSheet, Dimensions, View} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface ShimmerProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  isDark?: boolean;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width,
  height,
  borderRadius = 6,
  isDark = false,
}) => {
  const translateX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {duration: 1000, easing: Easing.linear}),
      -1,
      false,
    );
  }, [translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const baseColor = isDark ? '#1c1c1c' : '#e4e4e7';
  const shineColor = isDark ? '#2a2a2a' : '#f4f4f5';

  return (
    <View style={[styles.container, {width, height, borderRadius, backgroundColor: baseColor}]}>
      <Animated.View
        style={[styles.shimmer, animStyle, {backgroundColor: shineColor}]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    height: '100%',
    width: 80,
    opacity: 0.6,
  },
});
