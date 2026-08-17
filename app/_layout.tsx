import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/lib/firebase';
import { getFriendlyErrorMessage } from '@/lib/errors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setAuthError(null);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthReady(true);
      } else {
        signInAnonymously(auth).catch((error) => {
          setAuthError(getFriendlyErrorMessage(error));
        });
      }
    });

    return unsubscribe;
  }, [retryToken]);

  const handleRetry = useCallback(() => {
    setAuthError(null);
    setRetryToken((t) => t + 1);
  }, []);

  if (authError) {
    return (
      <View style={[layoutStyles.center, { backgroundColor: theme.background }]}>
        <Text style={[layoutStyles.mascot]}>🐯</Text>
        <Text style={[layoutStyles.errorText, { color: theme.danger }]}>{authError}</Text>
        <Pressable onPress={handleRetry} style={[layoutStyles.retryButton, { backgroundColor: theme.primary }]}>
          <Text style={layoutStyles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  if (!isAuthReady) {
    return (
      <View style={[layoutStyles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const layoutStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  mascot: {
    fontSize: 40,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
