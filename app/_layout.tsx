import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { HabitProvider, useHabits } from '../context/HabitContext';
import { Colors } from '../constants/theme';

// Must be called at the root level for OAuth redirect to work
WebBrowser.maybeCompleteAuthSession();

// Inner component so it can use hooks
function RootNavigator() {
  const { session, isLoading: authLoading } = useAuth();
  const { habits, isLoading: habitsLoading } = useHabits();
  const segments = useSegments();
  const router = useRouter();

  // NEW: Prevents race conditions by waiting for the layout tree to fully mount
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Wait for readiness AND data to load
    if (!isReady || authLoading || habitsLoading) return;

    const inAuthGroup =
      segments.length === 0 ||
      segments[0] === 'sign-up' ||
      segments[0] === 'forgot-password' ||
      segments[0] === 'verify-code' ||
      segments[0] === 'confirm-email';

    // 1. Not logged in, trying to access a protected page -> Kick out
    if (!session && !inAuthGroup) {
      router.replace('/');
    }
    // 2. JUST logged in via OTP, but URL hasn't updated to reset-password yet -> DO NOTHING (pauses the guard)
    else if (session && segments[0] === 'verify-code') {
      return;
    }
    // 3. Logged in, hanging out on auth pages (sign-up, forgot, etc) -> Go to Home
    else if (session && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
    // 4. Logged in, on a normal page
    else if (session && !inAuthGroup) {
      // Send to onboarding if no habits, EXCEPT if they are on the reset-password screen
      if (habits.length === 0 && segments[0] !== 'onboarding' && segments[0] !== 'reset-password') {
        router.replace('/onboarding');
      }
    }
  }, [isReady, session, authLoading, habitsLoading, habits, segments]); return (

    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerBackTitle: '',
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-email" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="verify-code" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="habit/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="add-habit" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="settings/[type]" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <HabitProvider>
        <RootNavigator />
      </HabitProvider>
    </AuthProvider>
  );
}
