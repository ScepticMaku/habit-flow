import React, { useState, useRef, useEffect } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

const CODE_LENGTH = 6;

// Supabase OTP types we support
type OtpType = 'signup' | 'recovery';

export default function VerifyCodeScreen() {
  const { email, type } = useLocalSearchParams<{ email: string; type?: string }>();
  const otpType = type as OtpType || 'recovery';

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text[text.length - 1];
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (newCode.every(c => c !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeStr: string) => {
    if (!email) {
      Alert.alert('Error', 'Missing email. Please go back and try again.');
      return;
    }

    setVerifying(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: codeStr,
      type: otpType,
    });

    setVerifying(false);

    if (error) {
      Alert.alert('Verification Failed', error.message);
      // Clear the code on error
      setCode(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
      return;
    }

    if (data.session) {
      // If this was a recovery flow, go to reset password
      // (Supabase may return a session directly, or we may need
      // to set the session and then update password)
      if (otpType === 'recovery') {
        router.replace('/reset-password');
      } else {
        router.replace('/(tabs)/home');
      }
    } else {
      // For recovery, sometimes verifyOtp doesn't return a session
      // but still succeeds — the user can now update their password
      if (otpType === 'recovery') {
        router.replace('/reset-password');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setTimer(30);
    setCanResend(false);
    setCode(Array(CODE_LENGTH).fill(''));
    inputs.current[0]?.focus();

    let error = null;

    if (otpType === 'recovery') {
      // Password reset flow — use resetPasswordForEmail
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'habitflow://reset-password',
      });
      error = result.error;
    } else {
      // Signup confirmation flow — use resend
      const result = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      error = result.error;
    }

    if (error) {
      Alert.alert('Error', error.message);
    }
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
              <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Verification</Text>
          <Text style={styles.desc}>
            We've sent a 6-digit code to{' '}
            <Text style={styles.emailHighlight}>{email}</Text>.
            Enter it below.
          </Text>

          <View style={styles.codeRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputs.current[i] = ref; }}
                style={[
                  styles.codeBox,
                  digit && styles.codeBoxFilled,
                  verifying && styles.codeBoxDisabled,
                ]}
                value={digit}
                onChangeText={text => handleChange(text, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!verifying}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyBtn, verifying && styles.verifyBtnDisabled]}
            onPress={() => handleVerify(code.join(''))}
            disabled={verifying}
            activeOpacity={0.8}
          >
            <Text style={styles.verifyBtnText}>
              {verifying ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                Resend code in <Text style={styles.timerText}>{timer}s</Text>
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
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
  emailHighlight: {
    fontWeight: '700',
    color: Colors.text,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxxl,
  },
  codeBox: {
    width: 48,
    height: 58,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  codeBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  codeBoxDisabled: {
    opacity: 0.5,
  },
  verifyBtn: {
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
  resendRow: {
    alignItems: 'center',
  },
  resendLink: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '700',
  },
  resendTimer: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  timerText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
