import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {usePrivacyStore} from '../store/usePrivacyStore';
import {useThemeStore} from '../store/useThemeStore';
import {designTokens} from '../theme/tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
const PIN_LENGTH = 4;
const SHAKE_DURATION = 400;

interface PinScreenProps {
  onUnlock: () => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({onUnlock}) => {
  const theme = useThemeStore((state) => state.theme);
  const pinCode = usePrivacyStore((state) => state.pinCode);
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'del') {
        setEntry((e) => e.slice(0, -1));
        return;
      }
      if (key === '') return;

      const next = entry + key;
      setEntry(next);

      if (next.length === PIN_LENGTH) {
        if (next === pinCode) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setEntry('');
            setError(false);
          }, SHAKE_DURATION);
        }
      }
    },
    [entry, pinCode, onUnlock],
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>screenshoti</Text>
      <Text style={[styles.subtitle, {color: theme.colors.muted}]}>Enter PIN to unlock</Text>

      <View style={styles.dots}>
        {Array.from({length: PIN_LENGTH}).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < entry.length
                    ? error
                      ? theme.colors.danger
                      : theme.colors.text
                    : 'transparent',
                borderColor: error ? theme.colors.danger : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>

      {error && (
        <Text style={[styles.errorText, {color: theme.colors.danger}]}>Incorrect PIN</Text>
      )}

      <View style={styles.pad}>
        {KEYS.map((key) => (
          <Pressable
            key={key || 'empty'}
            style={({pressed}) => [
              styles.key,
              {
                backgroundColor:
                  key === ''
                    ? 'transparent'
                    : pressed
                    ? theme.colors.surfaceVariant
                    : theme.colors.surface,
                borderColor: key === '' ? 'transparent' : theme.colors.border,
                borderWidth: key === '' ? 0 : 1,
              },
            ]}
            onPress={() => handleKey(key)}
            disabled={key === ''}>
            <Text
              style={[
                styles.keyLabel,
                {
                  color:
                    key === 'del' ? theme.colors.muted : theme.colors.text,
                },
              ]}>
              {key === 'del' ? '⌫' : key}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.xl,
  },
  title: {
    ...designTokens.typography.displayLarge,
    marginBottom: designTokens.spacing.xs,
  },
  subtitle: {
    ...designTokens.typography.bodyMedium,
    marginBottom: designTokens.spacing.huge,
  },
  dots: {
    flexDirection: 'row',
    gap: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  errorText: {
    ...designTokens.typography.bodySmall,
    marginBottom: designTokens.spacing.lg,
    marginTop: designTokens.spacing.xs,
  },
  pad: {
    marginTop: designTokens.spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: designTokens.spacing.md,
    justifyContent: 'center',
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: designTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    ...designTokens.typography.titleLarge,
  },
});
