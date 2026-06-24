import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";
import "@/lib/splashScreen";
import { useEffect } from "react";

import { Stack, useRouter, useSegments } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { parseLoopIdFromUrl, parsePlayLoopIdFromUrl } from "@/lib/parseLoopDeepLink";
import { BootSplash } from "@/components/BootSplash";
import { hideSplashOnce } from "@/lib/splashScreen";

import { onAuthStateChange, parseAuthCallbackUrl } from "@/lib/auth";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { useAuthStore } from "@/stores/authStore";
import { useDeepLinkStore } from "@/stores/deepLinkStore";

import { useLocaleStore, attachLocaleAppStateListener } from "@/stores/localeStore";
import { attachGenerationPollingAppState } from "@/lib/generationPolling";
import { useGenerationPrefsStore } from "@/stores/generationPrefsStore";

import { useVisualThemeStore } from "@/stores/visualThemeStore";

import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

import { SubscriptionService } from "@/lib/subscriptionService";
import { prefetchLoopCovers } from "@/lib/coverImageCache";
import { readLibraryCache } from "@/lib/offlineCache";
import { devWarn } from "@/lib/devLog";



const ONBOARDING_KEY = "producerhit_mobile_onboarding_v1";



export default function RootLayout() {

  const router = useRouter();

  const segments = useSegments();

  const session = useAuthStore((s) => s.session);

  const loading = useAuthStore((s) => s.loading);

  const onboardingDone = useAuthStore((s) => s.onboardingDone);
  const onboardingHydrated = useAuthStore((s) => s.onboardingHydrated);

  const setSession = useAuthStore((s) => s.setSession);

  const setLoading = useAuthStore((s) => s.setLoading);

  const hydrateProfileCache = useAuthStore((s) => s.hydrateProfileCache);

  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const setOnboardingDone = useAuthStore((s) => s.setOnboardingDone);
  const hydrateOnboarding = useAuthStore((s) => s.hydrateOnboarding);

  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const hydrateGenerationPrefs = useGenerationPrefsStore((s) => s.hydrate);
  const hydrateTheme = useVisualThemeStore((s) => s.hydrate);



  useEffect(() => {

    void hydrateLocale();
    void hydrateGenerationPrefs();
    void hydrateTheme();
    attachLocaleAppStateListener();
    attachGenerationPollingAppState();

  }, [hydrateLocale, hydrateGenerationPrefs, hydrateTheme]);



  useEffect(() => {
    void SubscriptionService.init().catch(() => undefined);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    void readLibraryCache(userId).then((rows) => {
      if (rows?.length) prefetchLoopCovers(rows);
    });
  }, [session?.user?.id]);



  useEffect(() => {
    void hydrateOnboarding();
  }, [hydrateOnboarding]);

  useEffect(() => {

    let mounted = true;



    void supabase.auth.getSession().then(async ({ data: { session: initial } }) => {

      if (!mounted) return;

      setSession(initial);

      if (initial?.user?.id) {
        await hydrateProfileCache(initial.user.id);
      }

      void refreshProfile();

      setLoading(false);

    });



    const { data } = onAuthStateChange((next) => {

      setSession(next);

      if (!next) {
        useAuthStore.setState({ profile: null, profileRefreshing: false });
        return;
      }

      void hydrateProfileCache(next.user.id).then(() => refreshProfile());

    });



    const handleDeepLink = (url: string) => {
      if (url.includes("auth/callback")) {
        void parseAuthCallbackUrl(url).catch(() => undefined);
        return;
      }
      const playId = parsePlayLoopIdFromUrl(url);
      if (playId) {
        useDeepLinkStore.getState().setPendingPlayLoopId(playId);
        router.push("/(tabs)/create");
        return;
      }
      const loopId = parseLoopIdFromUrl(url);
      if (!loopId) return;
      useDeepLinkStore.getState().setPendingLoopId(loopId);
      router.push("/(tabs)/community");
    };

    void Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const linkSub = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });



    return () => {

      mounted = false;

      data.subscription.unsubscribe();

      linkSub.remove();

    };

  }, [setSession, setLoading, hydrateProfileCache, refreshProfile, router]);



  useEffect(() => {

    if (loading || !onboardingHydrated) return;

    const inAuth = segments[0] === "(auth)";

    const inOnboarding = segments[0] === "(onboarding)";

    const inAuthCallback = segments[0] === "auth";

    // Utilisateur déjà connecté : ne jamais réafficher l'onboarding (évite boucle replace).
    if (session && !onboardingDone) {
      void AsyncStorage.setItem(ONBOARDING_KEY, "1");
      setOnboardingDone(true);
      return;
    }

    // Nouveau visiteur : onboarding une fois, avant la connexion.
    if (!onboardingDone && !session) {
      if (!inOnboarding) router.replace("/(onboarding)");
      return;
    }

    if (!session && !inAuth && !inOnboarding && !inAuthCallback) {

      router.replace("/(auth)/login");

      return;

    }

    if (session && (inAuth || inOnboarding)) {

      const pendingLoop = useDeepLinkStore.getState().pendingLoopId;

      router.replace(pendingLoop ? "/(tabs)/community" : "/(tabs)/create");

    }

  }, [session, loading, onboardingHydrated, segments, onboardingDone, router, setOnboardingDone]);



  useEffect(() => {
    if (!loading && onboardingHydrated) {
      void hideSplashOnce();
    }
  }, [loading, onboardingHydrated]);

  if (loading || !onboardingHydrated) {

    return (

      <SafeAreaProvider>

        <ThemeProvider>

          <BootSplash />

          <ThemedStatusBar />

        </ThemeProvider>

      </SafeAreaProvider>

    );

  }



  if (!isSupabaseConfigured()) {

    devWarn("Configure EXPO_PUBLIC_SUPABASE_* in apps/mobile/.env");

  }



  return (

    <SafeAreaProvider>

      <ThemeProvider>

        <ThemedStatusBar />

        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
          <Stack.Screen name="paywall" options={{ presentation: "modal", gestureEnabled: true }} />
        </Stack>

      </ThemeProvider>

    </SafeAreaProvider>

  );

}



function ThemedStatusBar() {

  const { colors } = useTheme();

  return <StatusBar style={colors.statusBar} />;

}


