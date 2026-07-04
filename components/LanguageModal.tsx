import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLanguageStore, Language } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import LanguagePicker from './LanguagePicker';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageModal({ visible, onClose }: LanguageModalProps) {
  const { colors } = useThemeStore();
  const { selectedLanguage, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const handleSelect = (language: Language) => {
    setLanguage(language);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable style={[styles.content, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.indicator, { backgroundColor: colors.border }]} />
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{t('language')}</Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.background }]}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <LanguagePicker onSelect={handleSelect} selectedLanguage={selectedLanguage} />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    paddingTop: 12,
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    height: 400,
    marginTop: 16,
  },
});
