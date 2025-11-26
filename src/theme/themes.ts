// Theme system for AdaptUI
export type ThemeType = 'glass' | 'brutal';

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    title: {
      fontSize: number;
      fontWeight: '700' | '800' | '900';
      lineHeight: number;
    };
    subtitle: {
      fontSize: number;
      fontWeight: '600' | '700';
      lineHeight: number;
    };
    body: {
      fontSize: number;
      fontWeight: '400' | '500';
      lineHeight: number;
    };
    caption: {
      fontSize: number;
      fontWeight: '400' | '500';
      lineHeight: number;
    };
  };
  effects: {
    blur: number;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
  };
}

// Glassmorphism Theme
export const glassTheme: Theme = {
  name: 'Glassmorphism',
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    background: '#0F172A',
    surface: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.2)',
    accent: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    title: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
  },
  effects: {
    blur: 20,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
};

// Neo-Brutal Theme
export const brutalTheme: Theme = {
  name: 'Neo-Brutal',
  colors: {
    primary: '#000000',
    secondary: '#FF6B6B',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#000000',
    accent: '#4ECDC4',
    success: '#95E1D3',
    warning: '#FFE66D',
    error: '#FF6B6B',
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 0,
    md: 0,
    lg: 0,
    xl: 0,
    full: 0,
  },
  typography: {
    title: {
      fontSize: 36,
      fontWeight: '900',
      lineHeight: 40,
    },
    subtitle: {
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
  },
  effects: {
    blur: 0,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 4, height: 4 },
  },
};

export const themes: Record<ThemeType, Theme> = {
  glass: glassTheme,
  brutal: brutalTheme,
};
