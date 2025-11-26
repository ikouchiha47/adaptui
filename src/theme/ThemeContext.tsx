import React, { ReactNode, createContext, useContext, useState } from 'react';
import { Theme, ThemeType, themes } from './themes';

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (type: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>('glass');

  const setTheme = (type: ThemeType) => {
    setThemeType(type);
  };

  const toggleTheme = () => {
    setThemeType(prev => prev === 'glass' ? 'brutal' : 'glass');
  };

  const value: ThemeContextType = {
    theme: themes[themeType],
    themeType,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
