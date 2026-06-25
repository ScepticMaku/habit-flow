import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();

  if (type === 'privacy') return <PrivacySettings />;
  if (type === 'about') return <AboutSettings />;
  if (type === 'notifications') return <NotificationSettings />;
  if (type === 'appearance') return <AppearanceSettings />;

  return <UnknownScreen />;
}

// --- PRIVACY & SECURITY ---
function PrivacySettings() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is PERMANENT and cannot be undone. All your habits, streaks, and data will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // Call our new Edge Function
      const { error } = await supabase.functions.invoke('delete-account');

      if (error) throw error;

      // Force log them out and send them to the login screen
      await signOut();
      router.replace('/');

    } catch (err: any) {
      Alert.alert('Deletion Failed', err.message || 'Could not delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'habitflow://reset-password',
      });

      if (error) throw error;

      // ✅ Navigate to the verify code screen instead of showing a link alert
      router.push({
        pathname: '/verify-code',
        params: { email: user.email, type: 'recovery' },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsShell title="Privacy & Security">
      <Text style={styles.sectionTitle}>Account Security</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Password</Text>
            <Text style={styles.cardSub}>Require code to change</Text>
          </View>
          <TouchableOpacity style={styles.cardBtn} onPress={handleChangePassword} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={styles.cardBtnText}>Change</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardSub}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Danger Zone</Text>
      <TouchableOpacity
        style={[styles.dangerCard, deleting && styles.dangerCardDisabled]}
        onPress={handleDeleteAccount}
        activeOpacity={0.7}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={Colors.danger} />
        ) : (
          <Ionicons name="trash-outline" size={22} color={Colors.danger} />
        )}
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.dangerTitle}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
          <Text style={styles.dangerSub}>Permanently remove your data</Text>
        </View>
        {!deleting && <Ionicons name="chevron-forward" size={18} color={Colors.danger} />}
      </TouchableOpacity>
    </SettingsShell>
  );
}

// --- NOTIFICATIONS ---
function NotificationSettings() {
  return (
    <SettingsShell title="Notifications">
      <View style={styles.infoBox}>
        <Ionicons name="notifications" size={32} color={Colors.primary} />
        <Text style={styles.infoTitle}>In-App Reminders</Text>
        <Text style={styles.infoDesc}>
          HabitFlow uses smart in-app reminders. Simply assign a specific time (like "7:00 AM") when creating or editing a habit.
        </Text>
        <Text style={styles.infoDesc}>
          Tap the bell icon on the Home screen to see a live feed of habits coming up in the next hour or that are overdue.
        </Text>
      </View>
    </SettingsShell>
  );
}

// --- APPEARANCE ---
function AppearanceSettings() {
  return (
    <SettingsShell title="Appearance">
      <View style={styles.infoBox}>
        <Ionicons name="color-palette" size={32} color={Colors.primary} />
        <Text style={styles.infoTitle}>Theme Customization</Text>
        <Text style={styles.infoDesc}>
          Dark mode and custom accent colors are coming in the next update! For now, HabitFlow uses a clean, optimized light theme.
        </Text>
      </View>
    </SettingsShell>
  );
}

// --- ABOUT ---
function AboutSettings() {
  return (
    <SettingsShell title="About">
      <View style={styles.aboutLogo}>
        <Text style={styles.aboutAppName}>HabitFlow</Text>
        <Text style={styles.aboutVersion}>Version 1.0.0</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.cardRow} onPress={() => Linking.openURL('https://your-privacy-policy-url.com')}>
          <Text style={styles.cardLabel}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.cardRow} onPress={() => Linking.openURL('https://your-terms-url.com')}>
          <Text style={styles.cardLabel}>Terms of Service</Text>
          <Ionicons name="open-outline" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.cardRow} onPress={() => Linking.openURL('mailto:support@habitflow.app')}>
          <Text style={styles.cardLabel}>Contact Support</Text>
          <Ionicons name="open-outline" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.copyright}>Made with ❤️ for building better habits.</Text>
    </SettingsShell>
  );
}

// --- UNKNOWN ROUTE ---
function UnknownScreen() {
  return (
    <SettingsShell title="Settings">
      <View style={styles.infoBox}>
        <Text style={styles.infoDesc}>Page not found.</Text>
      </View>
    </SettingsShell>
  );
}

// --- SHARED LAYOUT WRAPPER ---
function SettingsShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
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

  // Privacy Styles
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textTertiary, marginBottom: Spacing.md, marginTop: Spacing.lg, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, overflow: 'hidden', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  cardInfo: { flex: 1, marginRight: Spacing.md },
  cardLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  cardBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface },
  cardBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.lg },
  dangerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#FECACA' },
  dangerTitle: { fontSize: 15, fontWeight: '600', color: Colors.danger },
  dangerSub: { fontSize: 12, color: '#B91C1C', marginTop: 2 },

  // Info Box Styles (Notifications, Appearance)
  infoBox: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', shadowColor: Colors.shadowMedium, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
  infoTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.md },
  infoDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center' },

  // About Styles
  aboutLogo: { alignItems: 'center', marginBottom: Spacing.xxl, marginTop: Spacing.lg },
  aboutAppName: { fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  aboutVersion: { fontSize: 14, color: Colors.textTertiary, marginTop: Spacing.xs },
  copyright: { textAlign: 'center', fontSize: 13, color: Colors.textTertiary, marginTop: Spacing.xxl },
  dangerCardDisabled: { opacity: 0.6 },
});
