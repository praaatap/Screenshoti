import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {createSyncSnapshot, restoreSyncSnapshot, type SyncSnapshot} from '../services/sync/syncService';

interface SyncState {
  cloudSyncEnabled: boolean;
  lastSnapshotAt: string | null;
  backupSnapshot: SyncSnapshot | null;
  toggleCloudSync: () => void;
  createBackup: (data: unknown, secret: string) => void;
  restoreBackup: <T>(secret: string) => T | null;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      cloudSyncEnabled: false,
      lastSnapshotAt: null,
      backupSnapshot: null,

      toggleCloudSync: () => {
        set((state) => ({cloudSyncEnabled: !state.cloudSyncEnabled}));
      },

      createBackup: (data, secret) => {
        const snapshot = createSyncSnapshot(data, secret);
        set({backupSnapshot: snapshot, lastSnapshotAt: snapshot.createdAt});
      },

      restoreBackup: <T>(secret: string): T | null => {
        const snapshot = get().backupSnapshot;
        if (!snapshot) {
          return null;
        }

        return restoreSyncSnapshot<T>(snapshot, secret);
      },
    }),
    {
      name: 'sync-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
