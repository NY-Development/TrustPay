import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '../utils/storage';

export type ThemeType = 'light' | 'dark';

interface ThemeState {
  theme: ThemeType;
  isHydrated: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  isHydrated: false,

  setTheme: async (theme: ThemeType) => {
    await Storage.setItem(STORAGE_KEYS.THEME, theme);
    
    // Apply changes directly to index.html document element for absolute styling synchronization
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({ theme });
  },

  toggleTheme: async () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    await get().setTheme(next);
  },

  hydrate: async () => {
    const saved = await Storage.getItem<ThemeType>(STORAGE_KEYS.THEME);
    const matchedTheme = saved === 'dark' || saved === 'light' ? saved : 'light';
    
    if (matchedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({
      theme: matchedTheme,
      isHydrated: true,
    });
  },
}));
