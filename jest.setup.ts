import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insetValues = {top: 0, right: 0, bottom: 0, left: 0};
  const frameValues = {x: 0, y: 0, width: 320, height: 640};

  const SafeAreaInsetsContext = React.createContext(insetValues);
  const SafeAreaFrameContext = React.createContext(frameValues);

  const SafeAreaProvider = ({children}: {children: React.ReactNode}) =>
    React.createElement(
      SafeAreaFrameContext.Provider,
      {value: frameValues},
      React.createElement(SafeAreaInsetsContext.Provider, {value: insetValues}, children),
    );

  const SafeAreaView = ({children}: {children: React.ReactNode}) => children;

  return {
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    SafeAreaProvider,
    SafeAreaView,
    SafeAreaConsumer: SafeAreaInsetsContext.Consumer,
    useSafeAreaInsets: () => React.useContext(SafeAreaInsetsContext),
    useSafeAreaFrame: () => React.useContext(SafeAreaFrameContext),
    initialWindowMetrics: {insets: insetValues, frame: frameValues},
  };
});

jest.mock('react-native-reanimated', () => {
  const {Animated} = require('react-native');

  return {
    ...Animated,
    default: Animated,
    View: Animated.View,
    createAnimatedComponent: Animated.createAnimatedComponent,
    useSharedValue: <T,>(value: T) => ({value}),
    useAnimatedStyle: (updater: () => unknown) => updater(),
    withTiming: <T,>(value: T) => value,
    withRepeat: <T,>(value: T) => value,
  };
});

jest.mock('react-native-image-viewing', () => 'ImageView');

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    getPhotos: jest.fn().mockResolvedValue({edges: []}),
  },
}));

jest.mock('react-native-share', () => ({
  open: jest.fn().mockResolvedValue({success: true}),
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    IOS: {PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY'},
    ANDROID: {
      READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    LIMITED: 'limited',
    DENIED: 'denied',
  },
  check: jest.fn().mockResolvedValue('granted'),
  request: jest.fn().mockResolvedValue('granted'),
  openSettings: jest.fn().mockResolvedValue(undefined),
}));
