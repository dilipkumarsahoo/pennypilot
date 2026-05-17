import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useFinanceStore } from '@/store/financeStore';
import { format, subDays, subMonths, subYears, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

type TimeFilter = 'week' | 'month' | 'year';

export default function OverviewScreen() {
  const { transactions } = useFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

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
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const totalBalance = totalIncome - totalExpenses;

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        const amount = Math.abs(curr.amount);
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
        acc[date].expense += Math.abs(curr.amount);
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    const sortedDates = Object.keys(dates).sort();
    const numPoints = Math.min(6, sortedDates.length);
    const selectedDates = sortedDates.slice(-numPoints);

    return {
      labels: selectedDates.map(date => format(new Date(date), 'MMM d')),
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
      legend: ['Income', 'Expenses'],
    };
  }, [filteredTransactions]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Overview</Text>
        <Text style={styles.date}>{format(new Date(), 'MMMM yyyy')}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statAmount, { color: '#059669' }]}>
            ${totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statAmount, { color: '#dc2626' }]}>
            ${totalExpenses.toFixed(2)}
          </Text>
        </View>
      </View>

            {categoryBreakdown.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Expense Categories</Text>
          <PieChart
            data={categoryBreakdown}
            width={350}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}

      

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Income vs Expenses</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, timeFilter === 'week' && styles.activeFilter]}
              onPress={() => setTimeFilter('week')}
            >
              <Text style={[styles.filterText, timeFilter === 'week' && styles.activeFilterText]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, timeFilter === 'month' && styles.activeFilter]}
              onPress={() => setTimeFilter('month')}
            >
              <Text style={[styles.filterText, timeFilter === 'month' && styles.activeFilterText]}>
                Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, timeFilter === 'year' && styles.activeFilter]}
              onPress={() => setTimeFilter('year')}
            >
              <Text style={[styles.filterText, timeFilter === 'year' && styles.activeFilterText]}>
                Year
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <LineChart
          data={lineChartData}
          width={350}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
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
          yAxisLabel="$"
          yAxisInterval={1}
          withHorizontalLabels={true}
          fromZero={true}
        />
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
    '#6366f1', // Indigo
    '#f97316', // Orange
  ];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  date: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#6366f1',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#e0e7ff',
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
  },
  statAmount: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeFilter: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
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
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#6366f1',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});