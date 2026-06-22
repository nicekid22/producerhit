import { useEffect } from "react";

import { Stack, useRouter, useSegments } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { View, ActivityIndicator, StyleSheet } from "react-native";

import { SafeAreaProvider } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Linking from "expo-linking";

import { onAuthStateChange, parseAuthCallbackUrl } from "@/lib/auth";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { useAuthStore } from "@/stores/authStore";

import { useLocaleStore } from "@/stores/localeStore";
import { useGenerationPrefsStore } from "@/stores/generationPrefsStore";

import { useVisualThemeStore } from "@/stores/visualThemeStore";

import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

import { SubscriptionService } from "@/lib/subscriptionService";



const ONBOARDING_KEY = "producerhit_mobile_onboarding_v1";



export default function RootLayout() {

  const router = useRouter();

  const segments = useSegments();

  const session = useAuthStore((s) => s.session);

  const loading = useAuthStore((s) => s.loading);

  const onboardingDone = useAuthStore((s) => s.onboardingDone);

  const setSession = useAuthStore((s) => s.setSession);

  const setLoading = useAuthStore((s) => s.setLoading);

  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const setOnboardingDone = useAuthStore((s) => s.setOnboardingDone);

  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const hydrateGenerationPrefs = useGenerationPrefsStore((s) => s.hydrate);
  const hydrateTheme = useVisualThemeStore((s) => s.hydrate);



  useEffect(() => {

    void hydrateLocale();
    void hydrateGenerationPrefs();
    void hydrateTheme();

  }, [hydrateLocale, hydrateGenerationPrefs, hydrateTheme]);



  useEffect(() => {
    void SubscriptionService.init().catch(() => undefined);
  }, []);



  useEffect(() => {

    void AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {

      if (v === "1") setOnboardingDone(true);

    });

  }, [setOnboardingDone]);



  useEffect(() => {

    let mounted = true;



    void supabase.auth.getSession().then(({ data: { session: initial } }) => {

      if (!mounted) return;

      setSession(initial);

      void refreshProfile();

      setLoading(false);

    });



    const { data } = onAuthStateChange((next) => {

      setSession(next);

      void refreshProfile();

    });



    const linkSub = Linking.addEventListener("url", ({ url }) => {

      if (!url.includes("auth/callback")) return;

      void parseAuthCallbackUrl(url).catch(() => undefined);

    });



    return () => {

      mounted = false;

      data.subscription.unsubscribe();

      linkSub.remove();

    };

  }, [setSession, setLoading, refreshProfile]);



  useEffect(() => {

    if (loading) return;

    const inAuth = segments[0] === "(auth)";

    const inOnboarding = segments[0] === "(onboarding)";

    const inAuthCallback = segments[0] === "auth";



    if (!onboardingDone && !inOnboarding) {

      router.replace("/(onboarding)");

      return;

    }



    if (!session && !inAuth && !inOnboarding && !inAuthCallback) {

      router.replace("/(auth)/login");

      return;

    }



    if (session && (inAuth || inOnboarding)) {

      router.replace("/(tabs)/create");

    }

  }, [session, loading, segments, onboardingDone, router]);



  if (loading) {

    return (

      <SafeAreaProvider>

        <ThemeProvider>

          <BootScreen />

        </ThemeProvider>

      </SafeAreaProvider>

    );

  }



  if (!isSupabaseConfigured()) {

    console.warn("Configure EXPO_PUBLIC_SUPABASE_* in apps/mobile/.env");

  }



  return (

    <SafeAreaProvider>

      <ThemeProvider>

        <ThemedStatusBar />

        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
          <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
        </Stack>

      </ThemeProvider>

    </SafeAreaProvider>

  );

}



function BootScreen() {

  const { colors } = useTheme();

  return (

    <View style={[styles.boot, { backgroundColor: colors.bg }]}>

      <ActivityIndicator color={colors.accent} size="large" />

      <ThemedStatusBar />

    </View>

  );

}



function ThemedStatusBar() {

  const { colors } = useTheme();

  return <StatusBar style={colors.statusBar} />;

}



const styles = StyleSheet.create({

  boot: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

  },

});


