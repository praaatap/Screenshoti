import React from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {useThemeStore} from '../store/useThemeStore';
import {APP_VERSION} from '../types';

interface SettingsScreenProps {}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const theme = useThemeStore((state) => state.theme);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const autoDeleteDuplicates = useThemeStore((state) => state.autoDeleteDuplicates);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const toggleAutoDeleteDuplicates = useThemeStore((state) => state.toggleAutoDeleteDuplicates);
  const clearCache = useThemeStore((state) => state.clearCache);

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}> 
      <View style={[styles.settingRow, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
        <View>
          <Text style={[styles.label, {color: theme.colors.text}]}>Dark mode</Text>
          <Text style={[styles.description, {color: theme.colors.muted}]}>Enable dark appearance</Text>
        </View>
        <Switch value={isDarkMode} onValueChange={toggleDarkMode} thumbColor={theme.colors.primary} />
      </View>

      <View style={[styles.settingRow, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
        <View>
          <Text style={[styles.label, {color: theme.colors.text}]}>Auto-delete duplicates</Text>
          <Text style={[styles.description, {color: theme.colors.muted}]}>Remove duplicate screenshots automatically</Text>
        </View>
        <Switch
          value={autoDeleteDuplicates}
          onValueChange={toggleAutoDeleteDuplicates}
          thumbColor={theme.colors.primary}
        />
      </View>

      <Pressable
        style={[styles.clearButton, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
        onPress={() => {
          void clearCache();
        }}>
        <Text style={[styles.clearLabel, {color: theme.colors.text}]}>Clear cache</Text>
      </Pressable>

      <Text style={[styles.version, {color: theme.colors.muted}]}>App version {APP_VERSION}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  settingRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    maxWidth: 230,
  },
  clearButton: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  version: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
  },
});
