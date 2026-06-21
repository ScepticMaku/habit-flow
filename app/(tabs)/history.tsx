import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitContext';

type ViewMode = 'week' | 'month';

interface HistoryDay {
  dateKey: string;      // '2023-10-25' for sorting
  dayLabel: string;     // 'Mon'
  dateLabel: string;    // 'Oct 25'
  completed: number;
  total: number;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const { habits } = useHabits();
  const [mode, setMode] = useState<ViewMode>('week');
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const totalHabits = habits.length;

  const fetchHistory = async () => {
    if (!user) {
      setHistoryData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Determine start date (7 days ago for week, 30 days ago for month)
    const daysAgo = mode === 'week' ? 6 : 29;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);
    const startDateStr = startDate.toISOString().split('T')[0];

    try {
      // Fetch all logs for the selected period
      const { data: logs, error } = await supabase
        .from('habit_logs')
        .select('log_date, completed')
        .eq('user_id', user.id)
        .gte('log_date', startDateStr)
        .order('log_date', { ascending: true });

      if (error) throw error;

      // Group logs by date to count completed habits
      const groupedLogs: Record<string, number> = {};
      logs?.forEach(log => {
        if (log.completed) {
          groupedLogs[log.log_date] = (groupedLogs[log.log_date] || 0) + 1;
        }
      });

      // Generate the full date range array so days with NO logs still show up as 0%
      const formattedData: HistoryDay[] = [];
      const tempDate = new Date(startDate);

      while (tempDate <= new Date()) {
        const dateKey = tempDate.toISOString().split('T')[0];
        const dayLabel = tempDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dateLabel = tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        formattedData.push({
          dateKey,
          dayLabel,
          dateLabel,
          completed: groupedLogs[dateKey] || 0,
          total: totalHabits,
        });

        tempDate.setDate(tempDate.getDate() + 1);
      }

      setHistoryData(formattedData);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [mode, user, totalHabits]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalCompleted = historyData.reduce((sum, d) => sum + d.completed, 0);
    const totalPossible = historyData.reduce((sum, d) => sum + d.total, 0);
    const avgRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Calculate current streak (consecutive days where 100% completed, ending today or yesterday)
    let streak = 0;
    for (let i = historyData.length - 1; i >= 0; i--) {
      if (historyData[i].completed >= historyData[i].total && historyData[i].total > 0) {
        streak++;
      } else {
        // Allow today to be incomplete, but yesterday must be complete to continue streak
        if (i === historyData.length - 1) continue;
        break;
      }
    }

    return { avgRate, totalCompleted, streak };
  }, [historyData]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchHistory} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <Text style={styles.title}>History</Text>

        {/* Toggle Buttons */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'week' && styles.toggleBtnActive]}
            onPress={() => setMode('week')}
          >
            <Text style={[styles.toggleText, mode === 'week' && styles.toggleTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'month' && styles.toggleBtnActive]}
            onPress={() => setMode('month')}
          >
            <Text style={[styles.toggleText, mode === 'month' && styles.toggleTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.avgRate}%</Text>
                <Text style={styles.statLabel}>Avg. Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalCompleted}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>

            {/* Bar Chart */}
            {historyData.length > 0 ? (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Daily Completion</Text>
                <View style={styles.chartArea}>
                  {historyData.map((item) => {
                    const pct = item.total > 0 ? item.completed / item.total : 0;
                    return (
                      <View key={item.dateKey} style={styles.chartCol}>
                        <View style={styles.chartBarArea}>
                          <View style={styles.chartBarBg}>
                            <View
                              style={[
                                styles.chartBarFill,
                                {
                                  height: `${Math.max(pct * 100, 4)}%`,
                                  backgroundColor:
                                    pct >= 1
                                      ? Colors.success
                                      : pct >= 0.6
                                        ? '#F59E0B'
                                        : pct > 0
                                          ? '#FF8F65'
                                          : Colors.border,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <Text style={styles.chartLabel} numberOfLines={1}>
                          {mode === 'week' ? item.dayLabel : item.dateLabel.replace(/\s/g, '\n')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.legendText}>100%</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.legendText}>60-99%</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF8F65' }]} />
                    <Text style={styles.legendText}>&lt;60%</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
                    <Text style={styles.legendText}>Missed</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyChartCard}>
                <Text style={styles.emptyChartText}>No history yet.</Text>
                <Text style={styles.emptyChartSub}>Complete some habits to see your progress!</Text>
              </View>
            )}

            {/* Detailed List (Reversed so most recent is at the top) */}
            <Text style={styles.listTitle}>Daily Breakdown</Text>
            {[...historyData].reverse().map((item) => {
              const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
              const label = mode === 'week' ? `${item.dayLabel}, ${item.dateLabel}` : item.dateLabel;

              return (
                <View key={item.dateKey} style={styles.listItem}>
                  <View style={styles.listLeft}>
                    <Text style={styles.listLabel}>{label}</Text>
                    <Text style={styles.listSub}>
                      {item.completed}/{item.total} habits
                    </Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text
                      style={[
                        styles.listPercent,
                        { color: pct >= 100 ? Colors.success : pct >= 60 ? '#F59E0B' : Colors.danger },
                      ]}
                    >
                      {pct}%
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.textInverse,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyChartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xxxl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyChartSub: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBarArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  chartBarBg: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: Radius.sm,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  listLeft: {},
  listLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  listSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  listPercent: {
    fontSize: 15,
    fontWeight: '700',
  },
});
