import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password strength: 0-3
  const strength = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9!@#$%^&*]/.test(password),
  ].filter(Boolean).length;

  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = [Colors.danger, Colors.warning, '#F59E0B', Colors.success][strength];

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert('Notice', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Notice', 'Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('same as old password')) {
        message = 'New password must be different from your old password.';
      } else if (error.message.includes('too weak')) {
        message = 'Password is too weak. Please choose a stronger password.';
      }
      Alert.alert('Reset Failed', message);
      return;
    }

    Alert.alert(
      'Success',
      'Password has been reset. Please sign in with your new password.',
      [
        {
          text: 'Sign In',
          onPress: () => {
            supabase.auth.signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.illustration}>
            <View style={styles.illustCircle}>
              <Ionicons name="key" size={40} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.desc}>
            Create a new password. Make sure it's strong and different from your previous one.
          </Text>

          {/* New password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Password strength */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    { backgroundColor: i < strength ? strengthColor : Colors.borderLight },
                  ]}
                />
              ))}
              <Text style={[styles.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
            </View>
          )}

          {/* Confirm password */}
          <View style={[styles.inputWrap, { marginTop: Spacing.lg }]}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={Colors.textTertiary}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showCf}
            />
            <TouchableOpacity onPress={() => setShowCf(!showCf)} style={styles.eyeBtn}>
              <Ionicons name={showCf ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {confirm.length > 0 && password !== confirm && (
            <Text style={styles.errorText}>Passwords don't match</Text>
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.resetBtnText}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: Spacing.xxl,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  illustCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxxl,
    marginHorizontal: Spacing.lg,
  },
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
  inputIcon: { marginRight: Spacing.md },
  input: { flex: 1, fontSize: 15, color: Colors.text, height: 54 },
  eyeBtn: { padding: Spacing.sm },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacing.sm,
  },
  resetBtn: {
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  resetBtnDisabled: { opacity: 0.6 },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
});
