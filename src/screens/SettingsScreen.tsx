import React from 'react';
import {Alert, Pressable, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {getTrackedEvents} from '../services/observability/analytics';
import {usePrivacyStore} from '../store/usePrivacyStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useSyncStore} from '../store/useSyncStore';
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
  const pinEnabled = usePrivacyStore((state) => state.pinEnabled);
  const hidePrivateAlbums = usePrivacyStore((state) => state.hidePrivateAlbums);
  const lockOnBackground = usePrivacyStore((state) => state.lockOnBackground);
  const setPinCode = usePrivacyStore((state) => state.setPinCode);
  const toggleHidePrivateAlbums = usePrivacyStore((state) => state.toggleHidePrivateAlbums);
  const toggleLockOnBackground = usePrivacyStore((state) => state.toggleLockOnBackground);
  const cloudSyncEnabled = useSyncStore((state) => state.cloudSyncEnabled);
  const lastSnapshotAt = useSyncStore((state) => state.lastSnapshotAt);
  const toggleCloudSync = useSyncStore((state) => state.toggleCloudSync);
  const createBackup = useSyncStore((state) => state.createBackup);
  const screenshots = useScreenshotStore((state) => state.screenshots);

  const [pinInput, setPinInput] = React.useState('');

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

      <View style={[styles.settingRow, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
        <View style={styles.growText}>
          <Text style={[styles.label, {color: theme.colors.text}]}>App lock (PIN)</Text>
          <Text style={[styles.description, {color: theme.colors.muted}]}>Enable lock for sensitive screenshots</Text>
          <View style={styles.pinRow}>
            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              style={[styles.pinInput, {color: theme.colors.text, borderColor: theme.colors.border}]}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="Set 4-digit PIN"
              placeholderTextColor={theme.colors.muted}
              maxLength={6}
            />
            <Pressable
              style={[styles.pinButton, {backgroundColor: theme.colors.primary}]}
              onPress={() => {
                setPinCode(pinInput);
                setPinInput('');
              }}>
              <Text style={styles.pinButtonText}>{pinEnabled ? 'Update' : 'Enable'}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.settingRow, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
        <View>
          <Text style={[styles.label, {color: theme.colors.text}]}>Hide private albums</Text>
          <Text style={[styles.description, {color: theme.colors.muted}]}>Mask private content from overview</Text>
        </View>
        <Switch value={hidePrivateAlbums} onValueChange={toggleHidePrivateAlbums} thumbColor={theme.colors.primary} />
      </View>

      <View style={[styles.settingRow, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
        <View>
          <Text style={[styles.label, {color: theme.colors.text}]}>Lock on background</Text>
          <Text style={[styles.description, {color: theme.colors.muted}]}>Require unlock when app reopens</Text>
        </View>
        <Switch value={lockOnBackground} onValueChange={toggleLockOnBackground} thumbColor={theme.colors.primary} />
      </View>

      <View style={[styles.settingRow, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
        <View>
          <Text style={[styles.label, {color: theme.colors.text}]}>Cloud sync (optional)</Text>
          <Text style={[styles.description, {color: theme.colors.muted}]}>Prepare encrypted multi-device backup</Text>
        </View>
        <Switch value={cloudSyncEnabled} onValueChange={toggleCloudSync} thumbColor={theme.colors.primary} />
      </View>

      <Pressable
        style={[styles.clearButton, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
        onPress={() => {
          createBackup({screenshots}, 'screenshoti-secret');
          Alert.alert('Backup created', 'Local encrypted snapshot is ready for cloud upload.');
        }}>
        <Text style={[styles.clearLabel, {color: theme.colors.text}]}>Create encrypted backup</Text>
      </Pressable>

      <Pressable
        style={[styles.clearButton, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
        onPress={() => {
          const events = getTrackedEvents();
          Alert.alert('Tracked events', `${events.length} analytics events captured.`);
        }}>
        <Text style={[styles.clearLabel, {color: theme.colors.text}]}>View analytics status</Text>
      </Pressable>

      {lastSnapshotAt ? (
        <Text style={[styles.version, {color: theme.colors.muted}]}>Last backup {new Date(lastSnapshotAt).toLocaleString()}</Text>
      ) : null}

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
  growText: {
    flex: 1,
  },
  pinRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pinInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
  },
  pinButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
