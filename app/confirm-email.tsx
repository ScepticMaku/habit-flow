import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfirmEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResending(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Sent', 'A new confirmation email has been sent.');
    }
  };

  const handleGoToOtp = () => {
    if (!email) return;
    router.push({
      pathname: '/verify-code',
      params: { email, type: 'signup' },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.illustration}>
          <View style={styles.illustCircle}>
            <Ionicons name="mail" size={40} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.desc}>
          We've sent a confirmation link to{' '}
          <Text style={styles.emailHighlight}>{email}</Text>.
          Please click the link to verify your account.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
          <Text style={styles.infoText}>
            If you configured OTP verification instead of email links, tap the button below to enter your code manually.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.otpBtn}
          onPress={handleGoToOtp}
          activeOpacity={0.8}
        >
          <Ionicons name="keypad-outline" size={20} color={Colors.textInverse} />
          <Text style={styles.otpBtnText}>Enter Code Manually</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.resendBtn, resending && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={resending}
          activeOpacity={0.8}
        >
          <Text style={styles.resendBtnText}>
            {resending ? 'Sending...' : 'Resend Confirmation Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={styles.backToLogin}
        >
          <Text style={styles.backToLoginText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
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
    marginBottom: Spacing.xxl,
    marginHorizontal: Spacing.lg,
  },
  emailHighlight: {
    fontWeight: '700',
    color: Colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  otpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  otpBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  resendBtn: {
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  resendBtnDisabled: { opacity: 0.5 },
  resendBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  backToLogin: {
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
