import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password strength: 0–3
  const strength = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9!@#$%^&*]/.test(password),
  ].filter(Boolean).length;

  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = [Colors.danger, Colors.warning, '#F59E0B', Colors.success][strength];

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password.length >= 6 &&
    passwordsMatch &&
    agreed;

  const handleSignUp = async () => {
    if (!firstName.trim()) {
      Alert.alert('Notice', 'Please enter your first name');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Notice', 'Please enter your last name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Notice', 'Please enter your email address');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Notice', 'Password must be at least 6 characters');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Notice', 'Passwords do not match');
      return;
    }
    if (!agreed) {
      Alert.alert('Notice', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      // Friendly error messages for common cases
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Try signing in instead.';
      } else if (error.message.includes('password')) {
        message = 'Password is too weak. Use at least 6 characters with a mix of letters and numbers.';
      }
      Alert.alert('Sign Up Failed', message);
      return;
    }

    // If a session is returned, email auto-confirmation is enabled in Supabase
    if (data.session) {
      router.replace('/(tabs)/home');
    } else {
      // Email confirmation required — navigate to confirmation screen
      router.replace({
        pathname: '/verify-code',
        params: { email: email.trim(), type: 'signup' },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.flex}>
            {/* Top green section */}
            <View style={styles.headerSection}>
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
              <View style={styles.headerContent}>
                <Text style={styles.appName}>HabitFlow</Text>
                <Text style={styles.tagline}>Start your journey today</Text>
              </View>
            </View>

            {/* Bottom white form section */}
            <View style={styles.formSection}>
              <Text style={styles.welcome}>Create Account</Text>
              <Text style={styles.subtitle}>
                Fill in the details below to get started
              </Text>

              {/* Name row */}
              <View style={styles.nameRow}>
                <View style={[styles.nameField, { marginRight: Spacing.sm }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor={Colors.textTertiary}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[styles.nameField, { marginLeft: Spacing.sm }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor={Colors.textTertiary}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={Colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={Colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={Colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    {[0, 1, 2].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              i < strength ? strengthColor : Colors.borderLight,
                          },
                        ]}
                      />
                    ))}
                    <Text style={[styles.strengthText, { color: strengthColor }]}>
                      {strengthLabel}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm password input */}
              <View style={styles.inputGroup}>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={Colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={Colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(!showConfirm)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password match indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchRow}>
                    <Ionicons
                      name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={passwordsMatch ? Colors.success : Colors.danger}
                    />
                    <Text
                      style={[
                        styles.matchText,
                        { color: passwordsMatch ? Colors.success : Colors.danger },
                      ]}
                    >
                      {passwordsMatch ? 'Passwords match' : "Passwords don't match"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Terms checkbox */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreed && styles.checkboxChecked,
                  ]}
                >
                  {agreed && (
                    <Ionicons name="checkmark" size={14} color={Colors.textInverse} />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Sign Up button */}
              <TouchableOpacity
                style={[
                  styles.signUpBtn,
                  !canSubmit && styles.signUpBtnDisabled,
                  loading && styles.signUpBtnDisabled,
                ]}
                onPress={handleSignUp}
                disabled={!canSubmit || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.signUpBtnText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {/* Login link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    height: 180,
    backgroundColor: Colors.primary,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: -20,
  },
  headerContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.sm,
  },
  formSection: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  welcome: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  nameField: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
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
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    height: 54,
  },
  eyeBtn: {
    padding: Spacing.sm,
  },
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
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '500',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.accent,
    fontWeight: '600',
  },
  signUpBtn: {
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  signUpBtnDisabled: {
    opacity: 0.45,
  },
  signUpBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.lg,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  socialBtn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  socialBtnApple: {
    backgroundColor: '#1A1A2E',
    borderColor: '#1A1A2E',
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  socialBtnTextWhite: {
    color: Colors.textInverse,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '700',
  },
});
