import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Habit, mockHabits } from '../constants/data';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

interface HabitContextType {
  habits: Habit[];
  updateHabit: (id: string, delta: number) => void;
  addHabit: (newHabit: Omit<Habit, 'id' | 'current' | 'completedToday' | 'streak'>) => Promise<void>;
  editHabit: (id: string, payload: Omit<Habit, 'id' | 'current' | 'completedToday' | 'streak'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  getHabitById: (id: string) => Habit | undefined;
  dailyProgress: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const fetchHabitsAndLogs = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const today = getTodayStr();

    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today);

      if (logsError) throw logsError;

      if (habitsData.length === 0) {
        const habitsToInsert = mockHabits.map(h => ({
          user_id: user.id, name: h.name, icon: h.icon, color: h.color,
          target: h.target, unit: h.unit, time: h.time, category: h.category,
        }));

        const { data: seededHabits, error: seedError } = await supabase
          .from('habits').insert(habitsToInsert).select();

        if (!seedError && seededHabits) {
          setHabits(seededHabits.map(h => ({
            id: h.id, name: h.name, icon: h.icon, color: h.color,
            target: h.target, unit: h.unit, streak: 0, time: h.time,
            category: h.category, current: 0, completedToday: false,
          })));
        }
      } else {
        const logsMap = new Map<string, number>();
        logsData?.forEach(log => logsMap.set(log.habit_id, log.value));

        setHabits(habitsData.map(h => {
          const currentVal = logsMap.get(h.id) || 0;
          return {
            id: h.id, name: h.name, icon: h.icon, color: h.color,
            target: h.target, unit: h.unit, streak: 0, time: h.time,
            category: h.category, current: currentVal, completedToday: currentVal >= h.target,
          };
        }));
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchHabitsAndLogs(); }, [fetchHabitsAndLogs]);

  const updateHabit = async (id: string, delta: number) => {
    const updatedHabits = habits.map(h => {
      if (h.id !== id) return h;
      const next = Math.max(0, Math.min(h.target, h.current + delta));
      return { ...h, current: next, completedToday: next >= h.target };
    });
    setHabits(updatedHabits);

    if (!user) return;
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const newValue = Math.max(0, Math.min(habit.target, habit.current + delta));
    try {
      await supabase.from('habit_logs').upsert(
        { habit_id: id, user_id: user.id, log_date: getTodayStr(), value: newValue, completed: newValue >= habit.target },
        { onConflict: 'habit_id,user_id,log_date' }
      );
    } catch (error) { console.error('Failed to sync log:', error); }
  };

  const addHabit = async (payload: Omit<Habit, 'id' | 'current' | 'completedToday' | 'streak'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('habits').insert({
      user_id: user.id, name: payload.name, icon: payload.icon, color: payload.color,
      target: payload.target, unit: payload.unit, time: payload.time, category: payload.category,
    }).select().single();
    if (error) throw error;

    setHabits(prev => [...prev, {
      id: data.id, name: data.name, icon: data.icon, color: data.color,
      target: data.target, unit: data.unit, time: data.time, category: data.category,
      current: 0, completedToday: false, streak: 0,
    }]);
  };

  const editHabit = async (id: string, payload: Omit<Habit, 'id' | 'current' | 'completedToday' | 'streak'>) => {
    if (!user) return;
    const { error } = await supabase.from('habits').update({
      name: payload.name, icon: payload.icon, color: payload.color,
      target: payload.target, unit: payload.unit, time: payload.time, category: payload.category,
    }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;

    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...payload } : h));
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const getHabitById = (id: string) => habits.find(h => h.id === id);
  const completedCount = habits.filter(h => h.completedToday).length;
  const dailyProgress = habits.length > 0 ? completedCount / habits.length : 0;

  return (
    <HabitContext.Provider value={{ habits, updateHabit, addHabit, editHabit, deleteHabit, getHabitById, dailyProgress, isLoading, refetch: fetchHabitsAndLogs }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
}
