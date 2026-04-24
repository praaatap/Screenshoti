import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

interface PrivacyState {
  pinEnabled: boolean;
  pinCode: string | null;
  hidePrivateAlbums: boolean;
  lockOnBackground: boolean;
  setPinCode: (pin: string | null) => void;
  toggleHidePrivateAlbums: () => void;
  toggleLockOnBackground: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      pinEnabled: false,
      pinCode: null,
      hidePrivateAlbums: false,
      lockOnBackground: true,

      setPinCode: (pin) => {
        const normalized = pin?.trim() ?? null;
        set({pinCode: normalized, pinEnabled: Boolean(normalized)});
      },

      toggleHidePrivateAlbums: () => {
        set((state) => ({hidePrivateAlbums: !state.hidePrivateAlbums}));
      },

      toggleLockOnBackground: () => {
        set((state) => ({lockOnBackground: !state.lockOnBackground}));
      },
    }),
    {
      name: 'privacy-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
