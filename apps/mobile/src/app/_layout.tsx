import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import "@/i18n";

void SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { isLoading } = useAuth();

  return (
    <>
      <AnimatedSplashOverlay ready={!isLoading} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="create-org" />
        <Stack.Screen name="admin" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}
