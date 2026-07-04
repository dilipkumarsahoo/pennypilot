import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import i18n from '@/i18n';

export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRTL?: boolean;
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
];

const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // English

interface LanguageState {
  selectedLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
  saveLanguage: (language: Language) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  selectedLanguage: DEFAULT_LANGUAGE,

  setLanguage: async (language: Language) => {
    set({ selectedLanguage: language });
    
    // Change i18next language
    await i18n.changeLanguage(language.code);
    
    // Handle RTL
    const isRTL = !!language.isRTL;
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
      // Note: Full native mirroring requires reload, but dynamic styles handle immediate UI update
    }
    
    await get().saveLanguage(language);
  },

  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem('selectedLanguage');
      if (stored) {
        const parsed = JSON.parse(stored) as Language;
        if (parsed && parsed.code) {
          set({ selectedLanguage: parsed });
          await i18n.changeLanguage(parsed.code);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load language', e);
    }
  },

  saveLanguage: async (language: Language) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', JSON.stringify(language));
    } catch (e) {
      console.error('Failed to save language', e);
    }
  },
}));
