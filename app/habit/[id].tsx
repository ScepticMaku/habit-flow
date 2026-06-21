import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../../context/HabitContext';
import { weekDays, weekHistory } from '../../constants/data';
import { Colors, Spacing, Radius } from '../../constants/theme';
import CircularProgress from '../../components/CircularProgress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getHabitById, updateHabit } = useHabits();
  const habit = getHabitById(id);

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Habit not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = habit.target > 0 ? habit.current / habit.target : 0;
  const isWater = habit.id === '1';

  const handleIncrement = () => {
    if (habit.current >= habit.target) {
      Alert.alert('Completed', "You've already reached today's target!");
      return;
    }
    updateHabit(habit.id, 1);
  };

  const handleDecrement = () => {
    if (habit.current <= 0) return;
    updateHabit(habit.id, -1);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{habit.name}</Text>
            <Text style={styles.headerSub}>{habit.category}</Text>
          </View>
          {/* NEW: Edit Button */}
          <TouchableOpacity
            onPress={() => router.push(`/add-habit?id=${habit.id}`)}
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress display area */}
        <View style={styles.progressSection}>
          {isWater ? (
            <WaterVisual current={habit.current} target={habit.target} />
          ) : (
            <CircularProgress
              size={160}
              strokeWidth={14}
              progress={progress}
              color={habit.color}
            >
              <Text style={styles.bigNumber}>{habit.current}</Text>
              <Text style={styles.bigUnit}>/ {habit.target} {habit.unit}</Text>
            </CircularProgress>
          )}

          <Text style={styles.progressText}>
            {habit.completedToday
              ? 'Completed for today!'
              : `${Math.round(progress * 100)}% completed`}
          </Text>

          {/* Increment / Decrement buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDec]}
              onPress={handleDecrement}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: habit.color }]}
              onPress={handleIncrement}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={Colors.textInverse} />
              <Text style={styles.actionBtnText}>
                {isWater ? 'Add a Glass' : `+1 ${habit.unit}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats info */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={20} color={Colors.accent} />
            <Text style={styles.statValue}>{habit.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color={Colors.info} />
            <Text style={styles.statValue}>{habit.time}</Text>
            <Text style={styles.statLabel}>Schedule</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={20} color={Colors.success} />
            <Text style={styles.statValue}>{Math.round(progress * 100)}%</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* Weekly trend */}
        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>This Week</Text>
          <View style={styles.weekChart}>
            {weekDays.map((day, i) => {
              const h = weekHistory[i];
              const pct = h.total > 0 ? h.completed / h.total : 0;
              return (
                <View key={i} style={styles.weekCol}>
                  <View style={styles.weekBarArea}>
                    <View style={styles.weekBarBg}>
                      <View
                        style={[
                          styles.weekBarFill,
                          {
                            height: `${Math.max(pct * 100, 8)}%`,
                            backgroundColor:
                              i === new Date().getDay() - 1 || (i === 6 && new Date().getDay() === 0)
                                ? habit.color
                                : Colors.border,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.weekLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
            <Text style={styles.tipsTitle}>Tips</Text>
          </View>
          <Text style={styles.tipsText}>
            {isWater
              ? 'Try keeping a water bottle at your desk. Setting hourly reminders can help you stay on track throughout the day.'
              : 'Consistency is key. Try doing this habit at the same time every day to build a strong routine.'}
          </Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Water habit visual component */
function WaterVisual({ current, target }: { current: number; target: number }) {
  const glasses = Array.from({ length: target }, (_, i) => i < current);

  return (
    <View style={styles.waterGrid}>
      {glasses.map((filled, i) => (
        <View
          key={i}
          style={[
            styles.waterGlass,
            filled
              ? { backgroundColor: Colors.water, borderColor: Colors.water }
              : { backgroundColor: 'transparent', borderColor: Colors.border },
          ]}
        >
          {filled && <View style={styles.waterFill} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  navBack: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
  },
  bigUnit: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: -2,
  },
  progressText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  actionBtnDec: {
    width: 52,
    paddingHorizontal: 0,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  waterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    width: SCREEN_WIDTH - Spacing.xxl * 2,
    marginBottom: Spacing.md,
  },
  waterGlass: {
    width: 56,
    height: 72,
    borderRadius: Radius.md,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: Colors.water,
    opacity: 0.3,
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  weekCard: {
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
  weekTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  weekChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: Spacing.sm,
  },
  weekCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  weekBarArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  weekBarBg: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  weekBarFill: {
    width: '100%',
    borderRadius: Radius.sm,
    minHeight: 6,
  },
  weekLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  tipsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  editBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
