import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useHabits } from '../context/HabitContext';

// Pre-defined starter habits for the user to choose from
const STARTER_HABITS = [
  { name: 'Drink Water', icon: 'water', color: '#48CAE4', target: 8, unit: 'glasses', category: 'Health', time: 'All Day' },
  { name: 'Morning Exercise', icon: 'fitness', color: '#FF6B35', target: 30, unit: 'min', category: 'Fitness', time: '7:00 AM' },
  { name: 'Read a Book', icon: 'book', color: '#7C3AED', target: 30, unit: 'min', category: 'Learning', time: '9:00 PM' },
  { name: 'Meditation', icon: 'leaf', color: '#40916C', target: 10, unit: 'min', category: 'Wellness', time: '6:30 AM' },
  { name: 'Write Journal', icon: 'create', color: '#F59E0B', target: 1, unit: 'entry', category: 'Mindfulness', time: '10:00 PM' },
  { name: 'Go for a Walk', icon: 'walk', color: '#457B9D', target: 30, unit: 'min', category: 'Fitness', time: '6:00 PM' },
  { name: 'Healthy Eating', icon: 'heart', color: '#E63946', target: 3, unit: 'times', category: 'Health', time: '12:30 PM' },
  { name: 'Sleep by 11 PM', icon: 'moon', color: '#3D405B', target: 1, unit: 'times', category: 'Wellness', time: '11:00 PM' },
  { name: 'Learn a Language', icon: 'star', color: '#F472B6', target: 15, unit: 'min', category: 'Learning', time: '8:00 AM' },
];

const TIME_OPTIONS = ['6:00 AM', '8:00 AM', '12:00 PM', '5:00 PM', '9:00 PM'];

export default function OnboardingScreen() {
  const { addHabit } = useHabits();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectedTime, setSelectedTime] = useState('8:00 AM');
  const [isSaving, setIsSaving] = useState(false);

  const toggleHabit = (index: number) => {
    setSelectedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else if (newSet.size < 5) {
        newSet.add(index);
      } else {
        Alert.alert('Limit Reached', 'You can select up to 5 starter habits.');
      }
      return newSet;
    });
  };

  const handleFinish = async () => {
    if (selectedIndices.size === 0) {
      Alert.alert('Select Habits', 'Please choose at least one habit to get started!');
      return;
    }

    setIsSaving(true);
    try {
      // Add all selected habits to Supabase
      const promises = Array.from(selectedIndices).map(i => {
        const h = STARTER_HABITS[i];
        return addHabit({
          name: h.name,
          icon: h.icon,
          color: h.color,
          target: h.target,
          unit: h.unit,
          category: h.category,
          time: h.time, // Keeps the habit's specific default time
        });
      });

      await Promise.all(promises);

      // Navigate to Home once saved
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save habits. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Illustration */}
        <View style={styles.header}>
          <View style={styles.illustCircle}>
            <Ionicons name="rocket" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Let's build your routine</Text>
          <Text style={styles.subtitle}>
            Select up to 5 habits to get started. You can always add more later!
          </Text>
        </View>

        {/* Habit Grid */}
        <View style={styles.grid}>
          {STARTER_HABITS.map((habit, index) => {
            const isSelected = selectedIndices.has(index);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.habitCard,
                  isSelected && styles.habitCardSelected,
                ]}
                onPress={() => toggleHabit(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: habit.color + '18' }]}>
                  <Ionicons name={habit.icon as any} size={24} color={habit.color} />
                </View>
                <Text style={[styles.habitName, isSelected && styles.habitNameSelected]}>
                  {habit.name}
                </Text>
                <Text style={styles.habitMeta}>
                  {habit.target} {habit.unit} · {habit.time}
                </Text>

                {/* Checkmark overlay */}
                {isSelected && (
                  <View style={styles.checkOverlay}>
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preferred Time Selector (Optional UX) */}
        <Text style={styles.timeTitle}>When do you usually start your day?</Text>
        <View style={styles.timeRow}>
          {TIME_OPTIONS.map(time => (
            <TouchableOpacity
              key={time}
              style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}
              onPress={() => setSelectedTime(time)}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.timeHint}>This helps us customize your dashboard greeting.</Text>

        <View style={{ height: Spacing.xxl }} />

        {/* Finish Button */}
        <TouchableOpacity
          style={[styles.finishBtn, (selectedIndices.size === 0 || isSaving) && styles.finishBtnDisabled]}
          onPress={handleFinish}
          disabled={selectedIndices.size === 0 || isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <Text style={styles.finishBtnText}>Get Started ({selectedIndices.size})</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },

  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  illustCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  habitCard: {
    width: '48%', backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.sm, position: 'relative',
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  habitCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  iconWrap: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  habitName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  habitNameSelected: { color: Colors.primary },
  habitMeta: { fontSize: 11, color: Colors.textTertiary },
  checkOverlay: { position: 'absolute', top: Spacing.md, right: Spacing.md },

  timeTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.lg },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  timeChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  timeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  timeTextActive: { color: Colors.textInverse },
  timeHint: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl },

  finishBtn: {
    height: 56, backgroundColor: Colors.primary, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  finishBtnDisabled: { opacity: 0.5 },
  finishBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { fontSize: 14, color: Colors.textTertiary, fontWeight: '500' },
});
