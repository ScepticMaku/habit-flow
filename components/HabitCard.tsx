import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../constants/data';
import { Colors, Spacing, Radius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xxl * 2;

interface Props {
  habit: Habit;
  onPress: () => void;
}

export default function HabitCard({ habit, onPress }: Props) {
  const progress = habit.target > 0 ? habit.current / habit.target : 0;
  const isDone = habit.completedToday;

  return (
    <TouchableOpacity
      style={[styles.card, isDone && styles.cardDone]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: habit.color + '18' },
          ]}
        >
          <Ionicons name={habit.icon as any} size={22} color={habit.color} />
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.name, isDone && styles.nameDone]}
            numberOfLines={1}
          >
            {habit.name}
          </Text>
          <Text style={styles.meta}>
            {habit.current}/{habit.target} {habit.unit} · {habit.time}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {isDone ? (
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark" size={18} color={Colors.textInverse} />
          </View>
        ) : (
          <>
            <Text style={styles.percent}>
              {Math.round(progress * 100)}%
            </Text>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: habit.color,
                  },
                ]}
              />
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDone: {
    opacity: 0.7,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  meta: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  right: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  percent: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  barBg: {
    width: 50,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  checkWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
