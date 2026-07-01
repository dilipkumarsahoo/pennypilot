import { useCurrencyStore } from '@/store/currencyStore';

/**
 * Formats a numeric amount based on the currently selected currency in the store.
 */
export function formatCurrency(amount: number): string {
  const { selectedCurrency } = useCurrencyStore.getState();
  try {
    return new Intl.NumberFormat(selectedCurrency.locale, {
      style: 'currency',
      currency: selectedCurrency.code,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl.NumberFormat is not supported in the current JS environment
    return `${selectedCurrency.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * Converts an amount from one currency to another.
 * The architecture supports this conversion without modifying UI components.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;

  // Mock rates relative to USD (1 USD = rate)
  const rates: Record<string, number> = {
    USD: 1.0,
    INR: 83.5,
    EUR: 0.93,
    GBP: 0.79,
    JPY: 161.0,
    AUD: 1.5,
    CAD: 1.37,
    SGD: 1.36,
    AED: 3.67,
    CNY: 7.27,
  };

  const fromRate = rates[fromCurrency] || 1.0;
  const toRate = rates[toCurrency] || 1.0;

  // Convert to USD then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}
