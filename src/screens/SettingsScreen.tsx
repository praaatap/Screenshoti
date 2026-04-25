import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {getTrackedEvents} from '../services/observability/analytics';
import {usePrivacyStore} from '../store/usePrivacyStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useSyncStore} from '../store/useSyncStore';
import {useThemeStore} from '../store/useThemeStore';
import {useToastStore} from '../store/useToastStore';
import {SectionCard, SectionRow} from '../components/ui/SectionCard';
import {designTokens} from '../theme/tokens';
import {APP_VERSION} from '../types';

interface SettingsScreenProps {}

interface SettingToggleRowProps {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: () => void;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
  isLast?: boolean;
}

const SettingToggleRow: React.FC<SettingToggleRowProps> = ({
  icon, label, description, value, onValueChange, theme, isLast = false,
}) => (
  <SectionRow theme={theme} isLast={isLast}>
    <View style={styles.rowLeft}>
      <MaterialCommunityIcons name={icon} size={designTokens.iconSize.sm} color={theme.colors.primary} />
      <View style={styles.rowText}>
        <Text style={[designTokens.typography.titleMedium, {color: theme.colors.text}]}>{label}</Text>
        <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>{description}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor={value ? theme.colors.primary : theme.colors.outline}
      trackColor={{false: theme.colors.outlineVariant, true: theme.colors.primaryContainer}}
      accessibilityLabel={label}
      accessibilityState={{checked: value}}
    />
  </SectionRow>
);

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
  const showToast = useToastStore((state) => state.show);

  const [pinInput, setPinInput] = React.useState('');
  const [backupLoading, setBackupLoading] = React.useState(false);

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>

      {/* Appearance */}
      <SectionCard title="Appearance" theme={theme} noPadding>
        <SettingToggleRow
          icon="moon-waning-crescent"
          label="Dark mode"
          description="Enable dark appearance"
          value={isDarkMode}
          onValueChange={toggleDarkMode}
          theme={theme}
          isLast
        />
      </SectionCard>

      {/* Behavior */}
      <SectionCard title="Behavior" theme={theme} noPadding>
        <SettingToggleRow
          icon="content-duplicate"
          label="Auto-delete duplicates"
          description="Remove duplicate screenshots automatically"
          value={autoDeleteDuplicates}
          onValueChange={toggleAutoDeleteDuplicates}
          theme={theme}
          isLast
        />
      </SectionCard>

      {/* Privacy & Security */}
      <SectionCard title="Privacy & Security" theme={theme} noPadding>
        <SectionRow theme={theme}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="shield-lock" size={designTokens.iconSize.sm} color={theme.colors.primary} />
            <View style={[styles.rowText, {flex: 1}]}>
              <Text style={[designTokens.typography.titleMedium, {color: theme.colors.text}]}>App lock (PIN)</Text>
              <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>Lock with a PIN code</Text>
              <View style={styles.pinRow}>
                <TextInput
                  value={pinInput}
                  onChangeText={setPinInput}
                  style={[
                    styles.pinInput,
                    designTokens.typography.bodyMedium,
                    {color: theme.colors.text, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.background},
                  ]}
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
                    showToast(pinEnabled ? 'PIN updated.' : 'PIN enabled.', 'success');
                  }}>
                  <Text style={[designTokens.typography.labelMedium, {color: '#ffffff'}]}>
                    {pinEnabled ? 'Update' : 'Enable'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </SectionRow>
        <SettingToggleRow
          icon="eye-off"
          label="Hide private albums"
          description="Mask private content from overview"
          value={hidePrivateAlbums}
          onValueChange={toggleHidePrivateAlbums}
          theme={theme}
        />
        <SettingToggleRow
          icon="lock-clock"
          label="Lock on background"
          description="Require unlock when app reopens"
          value={lockOnBackground}
          onValueChange={toggleLockOnBackground}
          theme={theme}
          isLast
        />
      </SectionCard>

      {/* Backup & Sync */}
      <SectionCard title="Backup & Sync" theme={theme} noPadding>
        <SettingToggleRow
          icon="cloud-sync"
          label="Cloud sync"
          description="Prepare encrypted multi-device backup"
          value={cloudSyncEnabled}
          onValueChange={toggleCloudSync}
          theme={theme}
        />
        <SectionRow theme={theme} isLast>
          <Pressable
            style={styles.actionRow}
            disabled={backupLoading}
            onPress={() => {
              setBackupLoading(true);
              setTimeout(() => {
                createBackup({screenshots}, 'screenshoti-secret');
                setBackupLoading(false);
                showToast('Backup created! Ready for cloud upload.', 'success');
              }, 600);
            }}>
            {backupLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <MaterialCommunityIcons name="database-export" size={designTokens.iconSize.sm} color={theme.colors.primary} />
            )}
            <Text style={[designTokens.typography.titleMedium, {color: theme.colors.primary}]}>
              {backupLoading ? 'Creating backup...' : 'Create encrypted backup'}
            </Text>
          </Pressable>
        </SectionRow>
      </SectionCard>

      {/* Data */}
      <SectionCard title="Data" theme={theme} noPadding>
        <SectionRow theme={theme}>
          <Pressable style={styles.actionRow} onPress={() => { void clearCache(); showToast('Cache cleared.', 'success'); }}>
            <MaterialCommunityIcons name="broom" size={designTokens.iconSize.sm} color={theme.colors.primary} />
            <Text style={[designTokens.typography.titleMedium, {color: theme.colors.primary}]}>Clear cache</Text>
          </Pressable>
        </SectionRow>
        <SectionRow theme={theme} isLast>
          <Pressable
            style={styles.actionRow}
            onPress={() => {
              const events = getTrackedEvents();
              showToast(`${events.length} analytics events captured.`, 'info');
            }}>
            <MaterialCommunityIcons name="chart-bar" size={designTokens.iconSize.sm} color={theme.colors.primary} />
            <Text style={[designTokens.typography.titleMedium, {color: theme.colors.primary}]}>View analytics status</Text>
          </Pressable>
        </SectionRow>
      </SectionCard>

      {/* About */}
      <View style={styles.footer}>
        {lastSnapshotAt ? (
          <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted, textAlign: 'center'}]}>
            Last backup {new Date(lastSnapshotAt).toLocaleString()}
          </Text>
        ) : null}
        <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted, textAlign: 'center'}]}>
          Screenshoti v{APP_VERSION}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.huge,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.md,
    flex: 1,
  },
  rowText: {
    flex: 1,
    gap: designTokens.spacing.xxs,
  },
  pinRow: {
    marginTop: designTokens.spacing.sm,
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    alignItems: 'center',
  },
  pinInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.md,
    height: 40,
  },
  pinButton: {
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.md,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
    flex: 1,
  },
  footer: {
    gap: designTokens.spacing.xs,
    paddingTop: designTokens.spacing.sm,
  },
});
