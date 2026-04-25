import {create} from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  type: 'info',
  visible: false,

  show: (message, type = 'success') => {
    if (hideTimer) { clearTimeout(hideTimer); }
    set({message, type, visible: true});
    hideTimer = setTimeout(() => {
      set({visible: false});
      hideTimer = null;
    }, 2500);
  },

  hide: () => {
    if (hideTimer) { clearTimeout(hideTimer); }
    set({visible: false});
    hideTimer = null;
  },
}));
