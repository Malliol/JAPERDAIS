import { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ui_theme') === 'dark' ? 'dark' : 'light');
  const [fontSize, setFontSize] = useState(() => +localStorage.getItem('ui_fontsize') || 12);
  const [animEnabled, setAnimEnabled] = useState(() => localStorage.getItem('ui_anim') !== '0');

  useEffect(() => {
    document.body.dataset.theme = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('ui_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontSize / 12);
    document.body.style.fontSize = fontSize + 'px';
    localStorage.setItem('ui_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('ui_anim', animEnabled ? '1' : '0');
  }, [animEnabled]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, fontSize, setFontSize, animEnabled, setAnimEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
