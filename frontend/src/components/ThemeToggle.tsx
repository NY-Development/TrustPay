import React, { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, hydrate, isHydrated } = useThemeStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-55 flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 text-gray-805 dark:text-yellow-400 hover:text-[#0052cc] dark:hover:text-yellow-300 rounded-full shadow-lg border border-gray-150 dark:border-gray-700 cursor-pointer overflow-hidden transition-all duration-300 transform hover:scale-110 active:scale-95 group focus:outline-none"
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      aria-label="Toggle Theme Mode"
    >
      <span className="material-symbols-outlined text-[24px] transition-transform duration-500 ease-spring group-hover:rotate-45">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
