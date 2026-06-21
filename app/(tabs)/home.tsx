import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RefreshControl } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../../context/HabitContext';
import CircularProgress from '../../components/CircularProgress';
import HabitCard from '../../components/HabitCard';
import { Colors, Spacing, Radius } from '../../constants/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { habits, dailyProgress, isLoading, refetch } = useHabits();
  const [showNotifs, setShowNotifs] = useState(false);

  const firstName = user?.user_metadata?.first_name || 'User';
  const avatarLetter = firstName.charAt(0).toUpperCase();

  const completedCount = habits.filter(h => h.completedToday).length;

  // --- NEW: Filter Logic ---
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dynamically get categories from the user's actual habits
  const categories = ['All', ...Array.from(new Set(habits.map(h => h.category)))];

  // Filter the habits list based on selection
  const filteredHabits = selectedCategory === 'All'
    ? habits
    : habits.filter(h => h.category === selectedCategory);

  // Calculate upcoming/overdue reminders based on current time
  const reminders = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return habits
      .filter(h => {
        if (h.completedToday) return false;
        if (h.time.toLowerCase().includes('all day')) return false;

        const parts = h.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!parts) return false;

        let hours = parseInt(parts[1], 10);
        const minutes = parseInt(parts[2], 10);
        const period = parts[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const habitMinutes = hours * 60 + minutes;
        const diff = habitMinutes - currentMinutes;

        // Upcoming within 60 mins, or overdue (passed but not completed)
        return diff >= -60 && diff <= 60;
      })
      .map(h => {
        const parts = h.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)!;
        let hours = parseInt(parts[1], 10);
        const minutes = parseInt(parts[2], 10);
        const period = parts[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const habitMinutes = hours * 60 + minutes;
        const diff = habitMinutes - currentMinutes;

        let status = 'upcoming';
        let statusText = `in ${diff} min`;
        if (diff <= 0) {
          status = 'overdue';
          statusText = `${Math.abs(diff)} min ago`;
        } else if (diff === 0) {
          statusText = 'Now';
        }

        return { ...h, status, statusText, diff };
      })
      .sort((a, b) => a.diff - b.diff); // Sort by time (soonest first)
  }, [habits]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>

          <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifs(true)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            {reminders.length > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your habits...</Text>
          </View>
        ) : (
          <>
            {/* Daily progress card */}
            <View style={styles.progressCard}>
              <View style={styles.progressLeft}>
                <Text style={styles.progressTitle}>Daily Progress</Text>
                <Text style={styles.progressDesc}>
                  {completedCount} of {habits.length} habits completed
                </Text>
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={16} color={Colors.accent} />
                  <Text style={styles.streakText}>Keep it up!</Text>
                </View>
              </View>
              <CircularProgress size={100} strokeWidth={9} progress={dailyProgress} color={Colors.success}>
                <Text style={styles.progressPercent}>{Math.round(dailyProgress * 100)}%</Text>
              </CircularProgress>
            </View>

            {/* Today's habits section */}
            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Habits</Text>
              <Text style={styles.habitCount}>{filteredHabits.length} habits</Text>
            </View>

            {/* Filter Chips Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredHabits.map(habit => (
              <HabitCard key={habit.id} habit={habit} onPress={() => router.push(`/habit/${habit.id}`)} />
            ))}

            {/* Add habit button */}
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => router.push('/add-habit')}>
              <Ionicons name="add" size={22} color={Colors.textInverse} />
              <Text style={styles.addBtnText}>Add New Habit</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* In-App Notification Panel */}
      <Modal visible={showNotifs} transparent animationType="slide" onRequestClose={() => setShowNotifs(false)}>
        <View style={styles.notifOverlay}>
          <TouchableOpacity style={styles.notifOverlayBg} activeOpacity={1} onPress={() => setShowNotifs(false)} />
          <View style={styles.notifPanel}>
            <View style={styles.notifPanelHeader}>
              <Text style={styles.notifPanelTitle}>Reminders</Text>
              <TouchableOpacity onPress={() => setShowNotifs(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {reminders.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="checkmark-done-circle" size={48} color={Colors.success} />
                <Text style={styles.notifEmptyText}>You're all caught up!</Text>
                <Text style={styles.notifEmptySub}>No upcoming habits in the next hour.</Text>
              </View>
            ) : (
              <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
                {reminders.map(reminder => (
                  <TouchableOpacity
                    key={reminder.id}
                    style={styles.notifItem}
                    onPress={() => {
                      setShowNotifs(false);
                      router.push(`/habit/${reminder.id}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.notifIconWrap, { backgroundColor: reminder.color + '18' }]}>
                      <Ionicons name={reminder.icon as any} size={20} color={reminder.color} />
                    </View>
                    <View style={styles.notifInfo}>
                      <Text style={styles.notifItemName}>{reminder.name}</Text>
                      <Text style={styles.notifItemTime}>Scheduled for {reminder.time}</Text>
                    </View>
                    <View style={[
                      styles.notifStatusBadge,
                      reminder.status === 'overdue' ? styles.notifStatusOverdue : styles.notifStatusUpcoming
                    ]}>
                      <Text style={[
                        styles.notifStatusText,
                        reminder.status === 'overdue' ? styles.notifStatusTextOverdue : styles.notifStatusTextUpcoming
                      ]}>
                        {reminder.statusText}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl * 2 },
  loadingText: { marginTop: Spacing.lg, fontSize: 14, color: Colors.textTertiary, fontWeight: '500' },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl },
  avatarWrap: { width: 48, height: 48, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: Colors.textInverse },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  notifBtn: { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  progressCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xxl, shadowColor: Colors.shadowMedium, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
  progressLeft: { flex: 1, marginRight: Spacing.lg },
  progressTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  progressDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignSelf: 'flex-start' },
  streakText: { fontSize: 12, fontWeight: '600', color: Colors.accent, marginLeft: Spacing.xs },
  progressPercent: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1 },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginRight: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, backgroundColor: Colors.primary, borderRadius: Radius.md, marginTop: Spacing.lg, gap: Spacing.sm },
  addBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textInverse },

  // Notification Modal Styles
  notifOverlay: { flex: 1, justifyContent: 'flex-end' },
  notifOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  notifPanel: { backgroundColor: Colors.bg, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, minHeight: 300, maxHeight: '70%', padding: Spacing.xxl },
  notifPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  notifPanelTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  notifEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.xxxl },
  notifEmptyText: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  notifEmptySub: { fontSize: 13, color: Colors.textTertiary, marginTop: Spacing.xs, textAlign: 'center' },
  notifList: { flex: 1 },
  notifItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  notifIconWrap: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  notifInfo: { flex: 1 },
  notifItemName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  notifItemTime: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  notifStatusBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  notifStatusOverdue: { backgroundColor: '#FEE2E2' },
  notifStatusUpcoming: { backgroundColor: Colors.surface },
  notifStatusText: { fontSize: 12, fontWeight: '700' },
  notifStatusTextOverdue: { color: Colors.danger },
  notifStatusTextUpcoming: { color: Colors.primary },
  habitCount: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  chipsRow: {
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.sm, // Space between chips and the first card
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
});
