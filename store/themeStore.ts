import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  gradientStart: string;
  gradientEnd: string;
  danger: string;
  success: string;
}

interface ThemeState {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const colorMap = {
  blue: { primary: '#3b82f6', lightGradient: ['#3b82f6', '#1d4ed8'], darkGradient: ['#1e3a8a', '#0f172a'] },
  purple: { primary: '#8b5cf6', lightGradient: ['#8b5cf6', '#6d28d9'], darkGradient: ['#4c1d95', '#0f172a'] },
  green: { primary: '#10b981', lightGradient: ['#10b981', '#047857'], darkGradient: ['#064e3b', '#0f172a'] },
  orange: { primary: '#f97316', lightGradient: ['#f97316', '#c2410c'], darkGradient: ['#7c2d12', '#0f172a'] },
  pink: { primary: '#ec4899', lightGradient: ['#ec4899', '#be185d'], darkGradient: ['#831843', '#0f172a'] },
};

const lightThemeBase = {
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  danger: '#ef4444',
  success: '#10b981',
};

const darkThemeBase = {
  background: '#020617',
  card: '#0f172a',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#1e293b',
  danger: '#f87171',
  success: '#34d399',
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const defaultMode = 'system';
  const defaultColor = 'blue';
  const isDark = Appearance.getColorScheme() === 'dark';
  
  return {
    themeMode: defaultMode,
    themeColor: defaultColor,
    isDark,
    colors: {
      ...(isDark ? darkThemeBase : lightThemeBase),
      primary: colorMap[defaultColor].primary,
      gradientStart: colorMap[defaultColor][isDark ? 'darkGradient' : 'lightGradient'][0],
      gradientEnd: colorMap[defaultColor][isDark ? 'darkGradient' : 'lightGradient'][1],
    },

    initTheme: async () => {
      try {
        const mode = (await AsyncStorage.getItem('themeMode')) as ThemeMode || 'system';
        const color = (await AsyncStorage.getItem('themeColor')) as ThemeColor || 'blue';
        const sysDark = Appearance.getColorScheme() === 'dark';
        const currentIsDark = mode === 'system' ? sysDark : mode === 'dark';
        
        const themeBase = currentIsDark ? darkThemeBase : lightThemeBase;
        const gradients = colorMap[color][currentIsDark ? 'darkGradient' : 'lightGradient'];

        set({
          themeMode: mode,
          themeColor: color,
          isDark: currentIsDark,
          colors: {
            ...themeBase,
            primary: colorMap[color].primary,
            gradientStart: gradients[0],
            gradientEnd: gradients[1],
          }
        });
      } catch (e) {
        console.error('Failed to load theme', e);
      }
    },

    setThemeMode: async (mode) => {
      const { themeColor } = get();
      const sysDark = Appearance.getColorScheme() === 'dark';
      const currentIsDark = mode === 'system' ? sysDark : mode === 'dark';
      
      const themeBase = currentIsDark ? darkThemeBase : lightThemeBase;
      const gradients = colorMap[themeColor][currentIsDark ? 'darkGradient' : 'lightGradient'];

      set({
        themeMode: mode,
        isDark: currentIsDark,
        colors: {
          ...themeBase,
          primary: colorMap[themeColor].primary,
          gradientStart: gradients[0],
          gradientEnd: gradients[1],
        }
      });
      await AsyncStorage.setItem('themeMode', mode);
    },

    setThemeColor: async (color) => {
      const { isDark } = get();
      const themeBase = isDark ? darkThemeBase : lightThemeBase;
      const gradients = colorMap[color][isDark ? 'darkGradient' : 'lightGradient'];

      set({
        themeColor: color,
        colors: {
          ...themeBase,
          primary: colorMap[color].primary,
          gradientStart: gradients[0],
          gradientEnd: gradients[1],
        }
      });
      await AsyncStorage.setItem('themeColor', color);
    }
  };
});

Appearance.addChangeListener(({ colorScheme }) => {
  const store = useThemeStore.getState();
  if (store.themeMode === 'system') {
    const isDark = colorScheme === 'dark';
    const themeBase = isDark ? darkThemeBase : lightThemeBase;
    const gradients = colorMap[store.themeColor][isDark ? 'darkGradient' : 'lightGradient'];
    
    useThemeStore.setState({
      isDark,
      colors: {
        ...themeBase,
        primary: colorMap[store.themeColor].primary,
        gradientStart: gradients[0],
        gradientEnd: gradients[1],
      }
    });
  }
});
