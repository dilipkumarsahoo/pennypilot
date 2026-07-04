import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLanguageStore, SUPPORTED_LANGUAGES, Language } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { Search, Check } from 'lucide-react-native';

interface LanguagePickerProps {
  onSelect: (language: Language) => void;
  selectedLanguage: Language;
}

export default function LanguagePicker({ onSelect, selectedLanguage }: LanguagePickerProps) {
  const { colors } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: Language }) => {
    const isSelected = item.code === selectedLanguage.code;
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: `${colors.primary}15` },
        ]}
        onPress={() => onSelect(item)}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.flagText}>{item.flag}</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.nameText, { color: colors.text }]}>{item.nativeName}</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>{item.name}</Text>
          </View>
        </View>
        {isSelected && <Check size={20} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search language..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filteredLanguages}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    height: '100%',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    marginVertical: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagText: {
    fontSize: 24,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  subText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
});
