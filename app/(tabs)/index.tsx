import { useFinanceStore } from '@/store/financeStore';
import { useThemeStore } from '@/store/themeStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useLanguageStore } from '@/store/languageStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { Ionicons } from '@expo/vector-icons';
import { endOfDay, format, isWithinInterval, startOfDay, subDays, subMonths, subYears } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';

type TimeFilter = 'week' | 'month' | 'year';

export default function OverviewScreen() {
  const { transactions } = useFinanceStore();
  const { colors } = useThemeStore();
  const { selectedCurrency } = useCurrencyStore();
  const { selectedLanguage } = useLanguageStore();
  const { t } = useTranslation();
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const isRTL = !!selectedLanguage.isRTL;
  const localeStr = selectedLanguage.code === 'en' ? 'en-US' : selectedLanguage.code;

  // Filter transactions based on selected time period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
    }

    return transactions.filter(t =>
      isWithinInterval(new Date(t.date), {
        start: startOfDay(startDate),
        end: endOfDay(now)
      })
    );
  }, [transactions, timeFilter]);

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        const amount = curr.amount;
        acc[curr.category] = (acc[curr.category] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

    // Convert to pie chart data format
    return Object.entries(breakdown).map(([name, amount], index) => ({
      name,
      amount,
      color: getColorForIndex(index),
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    }));
  }, [filteredTransactions]);

  // Prepare line chart data
  const lineChartData = useMemo(() => {
    const dates = filteredTransactions.reduce((acc, curr) => {
      const date = format(new Date(curr.date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0 };
      }
      if (curr.type === 'income') {
        acc[date].income += curr.amount;
      } else {
        acc[date].expense += curr.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    const sortedDates = Object.keys(dates).sort();
    const numPoints = Math.min(6, sortedDates.length);
    const selectedDates = sortedDates.slice(-numPoints);

    return {
      labels: selectedDates.map(date => new Date(date).toLocaleDateString(localeStr, { month: 'short', day: 'numeric' })),
      datasets: [
        {
          data: selectedDates.map(date => dates[date].income),
          color: () => '#059669',
          strokeWidth: 2,
        },
        {
          data: selectedDates.map(date => dates[date].expense),
          color: () => '#dc2626',
          strokeWidth: 2,
        },
      ],
      legend: [t('income'), t('expenses')],
    };
  }, [filteredTransactions, localeStr, t]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}>
          {t("dashboard")}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
          {new Date().toLocaleDateString(localeStr, { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.balanceCard, { shadowColor: colors.primary }]}
      >
        <View style={[styles.balanceSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.balanceLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t("total_balance")}
          </Text>
          <View style={[styles.balanceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.balanceAmount, isRTL ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }]}>
              {isBalanceVisible ? formatCurrency(totalBalance) : '••••••••'}
            </Text>
            <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)} style={styles.eyeIcon}>
              <Ionicons name={isBalanceVisible ? "eye-off-outline" : "eye-outline"} size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={[styles.cardBottomRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.monthlyStat, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.monthlyStatLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t("monthly_income")}
            </Text>
            <View style={[styles.monthlyStatValueRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.monthlyStatAmount, isRTL ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8, marginLeft: 0 }]}>
                {formatCurrency(totalIncome)}
              </Text>
              <View style={[styles.percentageBadge, { backgroundColor: 'rgba(20, 184, 166, 0.15)', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="arrow-up" size={10} color="#14b8a6" style={{ transform: [{ rotate: '45deg' }] }} />
                <Text style={[styles.percentageText, { color: '#14b8a6', marginLeft: isRTL ? 0 : 2, marginRight: isRTL ? 2 : 0 }]}>5.2%</Text>
              </View>
            </View>
          </View>

          <View style={[styles.monthlyStat, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.monthlyStatLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t("monthly_expense")}
            </Text>
            <View style={[styles.monthlyStatValueRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.monthlyStatAmount, isRTL ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8, marginLeft: 0 }]}>
                {formatCurrency(totalExpenses)}
              </Text>
              <View style={[styles.percentageBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="arrow-down" size={10} color="#ef4444" style={{ transform: [{ rotate: '-45deg' }] }} />
                <Text style={[styles.percentageText, { color: '#ef4444', marginLeft: isRTL ? 0 : 2, marginRight: isRTL ? 2 : 0 }]}>2.6%</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {categoryBreakdown.length > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t("expense_categories")}
          </Text>
          <View style={[styles.donutRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.donutWrapper, { direction: 'ltr' }]}>
              <PieChart
                data={categoryBreakdown}
                width={160}
                height={160}
                chartConfig={{
                  color: (opacity = 1) => colors.primary,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[40, 0]}
                hasLegend={false}
                absolute
              />
              <View style={[styles.donutHole, { backgroundColor: colors.card, shadowColor: colors.border }]}>
                <Text style={[styles.donutHoleLabel, { color: colors.textSecondary }]}>{t("total")}</Text>
                <Text style={[styles.donutHoleValue, { color: colors.text }]}>
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>
            </View>

            <View style={[styles.customLegend, isRTL ? { paddingRight: 24, paddingLeft: 0 } : { paddingLeft: 24, paddingRight: 0 }]}>
              {categoryBreakdown.map((item, index) => (
                <View key={index} style={[styles.legendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }, isRTL ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10, marginLeft: 0 }]} />
                  <Text style={[styles.legendName, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.legendValue, { color: colors.text }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={[styles.chartContainer, { backgroundColor: colors.card, shadowColor: colors.border }]}>
        <View style={[styles.chartHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.chartTitle, { color: colors.text, marginBottom: 0 }]}>
            {t("income_vs_expenses")}
          </Text>
          <View style={[styles.filterButtons, { backgroundColor: colors.background, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[styles.filterButton, timeFilter === 'week' && [styles.activeFilter, { backgroundColor: colors.card, shadowColor: colors.border }]]}
              onPress={() => setTimeFilter('week')}
            >
              <Text style={[styles.filterText, { color: colors.textSecondary }, timeFilter === 'week' && [styles.activeFilterText, { color: colors.primary }]]}>
                {t("week")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, timeFilter === 'month' && [styles.activeFilter, { backgroundColor: colors.card, shadowColor: colors.border }]]}
              onPress={() => setTimeFilter('month')}
            >
              <Text style={[styles.filterText, { color: colors.textSecondary }, timeFilter === 'month' && [styles.activeFilterText, { color: colors.primary }]]}>
                {t("month")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, timeFilter === 'year' && [styles.activeFilter, { backgroundColor: colors.card, shadowColor: colors.border }]]}
              onPress={() => setTimeFilter('year')}
            >
              <Text style={[styles.filterText, { color: colors.textSecondary }, timeFilter === 'year' && [styles.activeFilterText, { color: colors.primary }]]}>
                {t("year")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ direction: 'ltr' }}>
          <LineChart
            data={lineChartData}
            width={330}
            height={220}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.border,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withShadow={false}
            withDots={true}
            withScrollableDot={false}
            yAxisLabel={selectedCurrency.symbol}
            yAxisInterval={1}
            withHorizontalLabels={true}
            fromZero={true}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// Helper function to generate colors for pie chart
function getColorForIndex(index: number): string {
  const colors = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#14b8a6', // Teal
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#10b981', // Emerald
    '#f97316', // Orange
  ];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  date: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#94a3b8',
    marginBottom: 8,
  },
  balanceRow: {
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    letterSpacing: -1,
  },
  eyeIcon: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  cardBottomRow: {
    justifyContent: 'space-between',
  },
  monthlyStat: {
    flex: 1,
  },
  monthlyStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#94a3b8',
    marginBottom: 6,
  },
  monthlyStatValueRow: {
    alignItems: 'center',
  },
  monthlyStatAmount: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  percentageBadge: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  chartContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  donutRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donutWrapper: {
    position: 'relative',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutHole: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  donutHoleLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  donutHoleValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  customLegend: {
    flex: 1,
    justifyContent: 'center',
  },
  legendItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  legendValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  filterButtons: {
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeFilter: {
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  activeFilterText: {},
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});