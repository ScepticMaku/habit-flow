import React, { useState, useEffect } from 'react';
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
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitContext';
import { supabase } from '../../utils/supabase';
import { Linking } from 'react-native';

// All possible achievements in the app
const ACHIEVEMENT_DEFS = [
  { key: 'first_habit', icon: 'leaf', label: 'Beginner', desc: 'Create your first habit', color: '#40916C' },
  { key: 'five_alive', icon: 'list', label: 'Collector', desc: 'Have 5 active habits', color: '#457B9D' },
  { key: 'streak_3', icon: 'flame', label: 'On Fire', desc: 'Reach a 3-day streak', color: Colors.accent },
  { key: 'streak_7', icon: 'trophy', label: 'Week Warrior', desc: 'Reach a 7-day streak', color: '#F59E0B' },
  { key: 'perfect_day', icon: 'star', label: 'Perfectionist', desc: 'Complete 100% in a day', color: '#7C3AED' },
  { key: 'dedicated', icon: 'fitness', label: 'Dedicated', desc: 'Complete 50 habits in 30d', color: '#E63946' },
];

interface UnlockedBadge {
  badge_key: string;
  unlocked_at: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { habits } = useHabits();

  const [stats, setStats] = useState({ streak: 0, totalHabits: 0, rate: 0, totalCompleted: 0, hasHadPerfectDay: false });
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Fetch 30-day logs
        const { data: logs, error: logsError } = await supabase
          .from('habit_logs')
          .select('log_date, completed')
          .eq('user_id', user.id)
          .gte('log_date', startDateStr);

        if (logsError) throw logsError;

        // Process logs
        const logsMap: Record<string, number> = {};
        let totalCompleted = 0;
        let hasHadPerfectDay = false;
        const totalHabitsCount = habits.length;

        logs?.forEach(log => {
          if (log.completed) {
            totalCompleted++;
            logsMap[log.log_date] = (logsMap[log.log_date] || 0) + 1;
          }
        });

        // Check for perfect days
        const uniqueDays = [...new Set(logs?.map(l => l.log_date))];
        uniqueDays.forEach(day => {
          if ((logsMap[day] || 0) >= totalHabitsCount && totalHabitsCount > 0) {
            hasHadPerfectDay = true;
          }
        });

        // Calculate Streak
        let streak = 0;
        const todayData = logsMap[todayStr];
        const isTodayComplete = todayData && totalHabitsCount > 0 && todayData >= totalHabitsCount;

        let checkDate = new Date();
        if (!isTodayComplete) checkDate.setDate(checkDate.getDate() - 1);

        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const dayCount = logsMap[dateStr] || 0;
          if (dayCount >= totalHabitsCount && totalHabitsCount > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }

        const newStats = { streak, totalHabits: totalHabitsCount, rate: 0, totalCompleted, hasHadPerfectDay };
        const totalPossible = uniqueDays.length * totalHabitsCount;
        newStats.rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        setStats(newStats);

        // 2. Fetch Unlocked Achievements
        const { data: badges } = await supabase
          .from('achievements')
          .select('badge_key, unlocked_at')
          .eq('user_id', user.id);

        const currentBadges = badges || [];
        setUnlockedBadges(currentBadges);

        // 3. Check for NEW achievements to unlock
        const conditions: Record<string, boolean> = {
          first_habit: totalHabitsCount >= 1,
          five_alive: totalHabitsCount >= 5,
          streak_3: streak >= 3,
          streak_7: streak >= 7,
          perfect_day: hasHadPerfectDay,
          dedicated: totalCompleted >= 50,
        };

        const newUnlocks = ACHIEVEMENT_DEFS.filter(
          def => conditions[def.key] && !currentBadges.some(b => b.badge_key === def.key)
        );

        if (newUnlocks.length > 0) {
          const inserts = newUnlocks.map(def => ({
            user_id: user.id,
            badge_key: def.key,
          }));
          await supabase.from('achievements').insert(inserts);
          setUnlockedBadges(prev => [
            ...prev,
            ...newUnlocks.map(d => ({ badge_key: d.key, unlocked_at: new Date().toISOString() }))
          ]);
        }

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, habits]);


  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
            router.replace('/');
          } catch (error) {
            console.error('Logout error:', error);
            setIsSigningOut(false);
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        }
      },
    ]);
  };


  const firstName = user?.user_metadata?.first_name || 'User';
  const lastName = user?.user_metadata?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = user?.email || '';
  const avatarLetter = firstName.charAt(0).toUpperCase();

  const settingsGroups = [
    [
      { icon: 'person-outline', label: 'Edit Profile', color: Colors.primary, route: '/edit-profile' },
      { icon: 'notifications-outline', label: 'Notifications', color: '#F59E0B', route: '/settings/notifications' },
      { icon: 'moon-outline', label: 'Appearance', color: '#7C3AED', route: '/settings/appearance' },
    ],
    [
      { icon: 'shield-checkmark-outline', label: 'Privacy & Security', color: Colors.info, route: '/settings/privacy' },
      { icon: 'help-circle-outline', label: 'Help & Support', color: Colors.success, action: 'support' },
      { icon: 'information-circle-outline', label: 'About', color: Colors.textTertiary, route: '/settings/about' },
    ],
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>

          {isLoading ? (
            <View style={styles.statsLoading}><ActivityIndicator size="small" color="rgba(255,255,255,0.6)" /></View>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalHabits}</Text>
                <Text style={styles.statLabel}>Habits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.rate}%</Text>
                <Text style={styles.statLabel}>30d Rate</Text>
              </View>
            </View>
          )}
        </View>

        {/* Achievements Card */}
        <View style={styles.achievementCard}>
          <View style={styles.achievementHeader}>
            <Text style={styles.achievementTitle}>Achievements</Text>
            <Text style={styles.achievementCount}>{unlockedBadges.length}/{ACHIEVEMENT_DEFS.length}</Text>
          </View>

          <View style={styles.achievementGrid}>
            {ACHIEVEMENT_DEFS.map((def) => {
              const isUnlocked = unlockedBadges.some(b => b.badge_key === def.key);
              const badgeData = unlockedBadges.find(b => b.badge_key === def.key);
              const dateStr = badgeData ? new Date(badgeData.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

              return (
                <View key={def.key} style={[styles.achievementBox, !isUnlocked && styles.achievementBoxLocked]}>
                  <View style={[styles.achIconWrap, { backgroundColor: isUnlocked ? def.color + '18' : Colors.borderLight }]}>
                    {isUnlocked ? (
                      <Ionicons name={def.icon as any} size={22} color={def.color} />
                    ) : (
                      <Ionicons name="lock-closed" size={18} color={Colors.textTertiary} />
                    )}
                  </View>
                  <Text style={[styles.achLabel, !isUnlocked && styles.achLabelLocked]} numberOfLines={1}>
                    {def.label}
                  </Text>
                  {isUnlocked && dateStr ? (
                    <Text style={styles.achDate}>{dateStr}</Text>
                  ) : (
                    <Text style={styles.achDesc} numberOfLines={2}>{def.desc}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {settingsGroups.map((group, gi) => (
          <View key={gi} style={styles.settingsGroup}>
            {group.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={styles.settingItem}
                activeOpacity={0.6}
                onPress={() => {
                  if (item.route) router.push(item.route as any);
                  else if (item.action === 'support') Linking.openURL('mailto:support@habitflow.app?subject=HabitFlow Support');
                }}
              >
                <View style={[styles.settingIcon, { backgroundColor: item.color + '14' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.logoutBtn, isSigningOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          )}
          <Text style={[styles.logoutText, isSigningOut && styles.logoutTextDisabled]}>
            {isSigningOut ? 'Signing out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: Spacing.xl },
  profileCard: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.xl },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  profileAvatarText: { fontSize: 28, fontWeight: '800', color: Colors.textInverse },
  profileName: { fontSize: 20, fontWeight: '700', color: Colors.textInverse },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.xs, marginBottom: Spacing.xxl },
  statsLoading: { height: 50, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, paddingVertical: Spacing.lg, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.textInverse },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Achievement Styles (Updated for 3-column grid)
  achievementCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, shadowColor: Colors.shadowMedium, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
  achievementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  achievementTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  achievementCount: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  achievementBox: { width: '31%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  achievementBoxLocked: { opacity: 0.6, backgroundColor: Colors.bg },
  achIconWrap: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  achLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 2 },
  achLabelLocked: { color: Colors.textTertiary },
  achDate: { fontSize: 10, color: Colors.success, fontWeight: '600', textAlign: 'center' },
  achDesc: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center', lineHeight: 14 },

  settingsGroup: { backgroundColor: Colors.card, borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  settingIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, paddingVertical: Spacing.lg, marginTop: Spacing.md, gap: Spacing.sm, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1 },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.danger },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutTextDisabled: { color: Colors.textTertiary },
});
