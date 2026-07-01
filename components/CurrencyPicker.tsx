import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useCurrencyStore, SUPPORTED_CURRENCIES, Currency } from '@/store/currencyStore';
import { useThemeStore } from '@/store/themeStore';
import { Search, Check } from 'lucide-react-native';

interface CurrencyPickerProps {
  onSelect: (currency: Currency) => void;
  selectedCurrency: Currency;
}

export default function CurrencyPicker({ onSelect, selectedCurrency }: CurrencyPickerProps) {
  const { colors } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: Currency }) => {
    const isSelected = item.code === selectedCurrency.code;
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
          <View style={[styles.symbolBadge, { backgroundColor: isSelected ? colors.primary : colors.border }]}>
            <Text style={[styles.symbolText, { color: isSelected ? '#ffffff' : colors.text }]}>
              {item.symbol}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.codeText, { color: colors.text }]}>{item.code}</Text>
            <Text style={[styles.nameText, { color: colors.textSecondary }]}>{item.name}</Text>
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
          placeholder="Search currency..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filteredCurrencies}
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
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 1,
    marginVertical: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  symbolBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  symbolText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  textContainer: {
    flex: 1,
  },
  codeText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  nameText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
});
