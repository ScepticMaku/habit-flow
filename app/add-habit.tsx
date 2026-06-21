import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useHabits } from '../context/HabitContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICON_OPTIONS = [
  'water', 'bicycle', 'book', 'leaf', 'create', 'walk',
  'fitness', 'heart', 'star', 'moon', 'musical-notes', 'rocket',
];
const COLOR_OPTIONS = [
  '#48CAE4', '#FF6B35', '#7C3AED', '#40916C',
  '#F59E0B', '#E63946', '#457B9D', '#F472B6',
];
const CATEGORY_OPTIONS = ['Health', 'Fitness', 'Learning', 'Wellness', 'Mindfulness', 'Other'];
const UNIT_OPTIONS = ['times', 'min', 'glasses', 'hours', 'pages', 'reps'];

export default function HabitFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { addHabit, editHabit, deleteHabit, getHabitById } = useHabits();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Health');
  const [icon, setIcon] = useState('leaf');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('times');
  const [time, setTime] = useState('All Day');
  const [loading, setLoading] = useState(false);

  // Pre-fill form if editing
  useEffect(() => {
    if (isEditing && id) {
      const habit = getHabitById(id);
      if (habit) {
        setName(habit.name);
        setCategory(habit.category);
        setIcon(habit.icon);
        setColor(habit.color);
        setTarget(habit.target.toString());
        setUnit(habit.unit);
        setTime(habit.time);
      } else {
        Alert.alert('Error', 'Habit not found.');
        router.back();
      }
    }
  }, [id, isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Please enter a habit name.');
      return;
    }
    const targetNum = parseInt(target, 10);
    if (isNaN(targetNum) || targetNum < 1) {
      Alert.alert('Invalid Target', 'Target must be at least 1.');
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      icon,
      color,
      target: targetNum,
      unit,
      time: time.trim() || 'All Day',
    };

    setLoading(true);
    try {
      if (isEditing && id) {
        await editHabit(id, payload);
      } else {
        await addHabit(payload);
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not save habit.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteHabit(id);
              router.push('/(tabs)/home');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete habit.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Habit' : 'New Habit'}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

          {/* Name Input */}
          <Text style={styles.label}>Habit Name</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} placeholder="e.g. Drink Water" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} maxLength={40} />
          </View>

          {/* Category Chips */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map(cat => (
              <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)} activeOpacity={0.7}>
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Icon Grid */}
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map(ic => (
              <TouchableOpacity key={ic} style={[styles.iconBox, icon === ic && { backgroundColor: color + '20', borderColor: color }]} onPress={() => setIcon(ic)} activeOpacity={0.7}>
                <Ionicons name={ic as any} size={24} color={icon === ic ? color : Colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Row */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorCircle, color === c && styles.colorCircleActive, { backgroundColor: c }]} onPress={() => setColor(c)} activeOpacity={0.7}>
                {color === c && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Target & Unit Row */}
          <Text style={styles.label}>Daily Target</Text>
          <View style={styles.targetRow}>
            <View style={[styles.targetInputWrap, { flex: 1 }]}>
              <TextInput style={styles.input} placeholder="1" placeholderTextColor={Colors.textTertiary} value={target} onChangeText={setTarget} keyboardType="number-pad" maxLength={3} />
            </View>
            <View style={styles.unitScroll}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {UNIT_OPTIONS.map(u => (
                  <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)} activeOpacity={0.7}>
                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Time Input */}
          <Text style={styles.label}>Schedule (Optional)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="time-outline" size={20} color={Colors.textTertiary} style={{ marginRight: Spacing.md }} />
            <TextInput style={styles.input} placeholder="e.g. 7:00 AM or All Day" placeholderTextColor={Colors.textTertiary} value={time} onChangeText={setTime} />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={[styles.createBtn, (!name.trim() || loading) && styles.createBtnDisabled]} onPress={handleSave} disabled={!name.trim() || loading} activeOpacity={0.8}>
            <Text style={styles.createBtnText}>{loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Habit'}</Text>
          </TouchableOpacity>

          {/* Delete Button (Only in Edit Mode) */}
          {isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7} disabled={loading}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              <Text style={styles.deleteBtnText}>Delete Habit</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { paddingTop: 40, flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.md, marginTop: Spacing.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 54,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, height: 54 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.textInverse },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  iconBox: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: Spacing.lg },
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  colorCircleActive: { borderWidth: 3, borderColor: Colors.text },
  targetRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  targetInputWrap: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 54, justifyContent: 'center' },
  unitScroll: { flex: 2 },
  unitChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm },
  unitChipActive: { backgroundColor: Colors.surface, borderColor: Colors.primary },
  unitText: { fontSize: 14, fontWeight: '600', color: Colors.textTertiary },
  unitTextActive: { color: Colors.primary },
  createBtn: { height: 56, backgroundColor: Colors.primary, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xxl },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: Colors.danger },
});
