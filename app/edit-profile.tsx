import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill fields on mount
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata || {};
      setFirstName(meta.first_name || '');
      setLastName(meta.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Notice', 'First name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      // Only update names since email is now uneditable
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.formContent}>
          {/* Avatar Preview */}
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {firstName.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Profile Photo</Text>

          {/* First Name */}
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          {/* Last Name */}
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          {/* Email - NOW UNEDITABLE */}
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrap, styles.inputWrapDisabled]}>
            <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} style={{ marginRight: Spacing.md }} />
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              placeholder="Email"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              pointerEvents="none" // Prevents cursor from showing on tap
            />
          </View>

          <View style={{ flex: 1 }} />

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
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
  formContent: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  avatarLargeText: { fontSize: 32, fontWeight: '800', color: Colors.textInverse },
  avatarHint: { fontSize: 13, color: Colors.accent, fontWeight: '600', marginBottom: Spacing.xxl },
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
  // NEW: Styling for the disabled email wrapper
  inputWrapDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderLight,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, height: 54 },
  // NEW: Styling for the disabled text
  disabledInput: {
    color: Colors.textTertiary,
  },
  saveBtn: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
