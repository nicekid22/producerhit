import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RouteFade } from "@/components/RouteFade";
import { LoopsBootstrap } from "@/components/LoopsBootstrap";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";
import { AppToaster } from "@/components/AppToaster";
import { ReferralReferrerWatcher } from "@/components/growth/ReferralReferrerWatcher";
import { SeoBootstrap } from "@/components/SeoBootstrap";
import { PageLoader } from "@/components/PageLoader";
import { SiteTextureVeil } from "@/components/SiteTextureVeil";
import { RouteStylesBootstrap } from "@/components/RouteStylesBootstrap";
import { isSampleLabEnabled } from "@/lib/sampleLab";
import { COMPARISON_PAGE_PATHS, SEO_PAGE_PATHS } from "@/generated/marketingRoutePaths";
import { GrowthBootstrap } from "@/components/GrowthBootstrap";
import { GrowthPlatformBootstrap } from "@/components/growth/GrowthPlatformBootstrap";
import { GrowthAdsBootstrap } from "@/components/growth/GrowthAdsBootstrap";
import { PlayerDockBootstrap } from "@/components/PlayerDockBootstrap";
import { AudioPlayer } from "@/components/AudioPlayer";

const LootRevealModal = lazy(() =>
  import("@/components/growth/LootRevealModal").then((m) => ({ default: m.LootRevealModal })),
);
const CommercialLicenseHost = lazy(() =>
  import("@/components/license/CommercialLicenseHost").then((m) => ({ default: m.CommercialLicenseHost })),
);
const GrowthUpsellHost = lazy(() =>
  import("@/components/growth/GrowthUpsellHost").then((m) => ({ default: m.GrowthUpsellHost })),
);
const StripeCheckoutModal = lazy(() =>
  import("@/components/billing/StripeCheckoutModal").then((m) => ({ default: m.StripeCheckoutModal })),
);
const GenerationActivityPill = lazy(() =>
  import("@/components/generation/GenerationActivityPill").then((m) => ({ default: m.GenerationActivityPill })),
);

const LandingPage = lazy(() => import("@/pages/Landing"));
const HomePage = lazy(() => import("@/pages/Home"));
const ComparePage = lazy(() => import("@/pages/ComparePage"));
const BlogPage = lazy(() => import("@/pages/Blog"));
const ExplorePage = lazy(() => import("@/pages/Explore"));
const CommunityTrendingPage = lazy(() => import("@/pages/CommunityTrending"));
const PublicLoopPage = lazy(() => import("@/pages/PublicLoop"));
const CreatorProfilePage = lazy(() => import("@/pages/CreatorProfile"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const AuthPage = lazy(() => import("@/pages/Auth"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallback"));
const PricingPage = lazy(() => import("@/pages/Pricing"));
const LegalPage = lazy(() => import("@/pages/Legal"));
const CommercialLicensePage = lazy(() => import("@/pages/CommercialLicense"));
const CommercialLicenseExamplePage = lazy(() => import("@/pages/CommercialLicenseExample"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const LibraryPage = lazy(() => import("@/pages/Library"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const GrowthAdminPage = lazy(() => import("@/pages/GrowthAdmin"));
const SampleLabPage = lazy(() => import("@/pages/SampleLab"));
const VoiceStudioPage = lazy(() => import("@/pages/VoiceStudio"));
const CloudThemePreviewPage = lazy(() => import("@/pages/CloudThemePreview"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));

export default function App() {
  return (
    <Router>
      <AuthBootstrap>
        <ThemeBootstrap>
          <LoopsBootstrap>
            <AppToaster />
            <Suspense fallback={null}>
              <LootRevealModal />
            </Suspense>
            <ReferralReferrerWatcher />
            <SeoBootstrap />
            <GrowthBootstrap />
            <GrowthPlatformBootstrap />
            <GrowthAdsBootstrap />
            <RouteStylesBootstrap />
            <PlayerDockBootstrap />
            <RouteFade>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/community/vibe/:vibeId" element={<ExplorePage />} />
                  <Route path="/community" element={<ExplorePage />} />
                  <Route path="/trending" element={<CommunityTrendingPage />} />
                  <Route path="/loop/:id" element={<PublicLoopPage />} />
                  <Route path="/u/:username" element={<CreatorProfilePage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/category/:categorySlug" element={<BlogPage />} />
                  <Route path="/blog/tag/:tagSlug" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  {SEO_PAGE_PATHS.map((path) => (
                    <Route key={path} path={path} element={<HomePage />} />
                  ))}
                  {COMPARISON_PAGE_PATHS.map((path) => (
                    <Route key={path} path={path} element={<ComparePage />} />
                  ))}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="/commercial-license" element={<CommercialLicensePage />} />
                  <Route path="/commercial-license/example" element={<CommercialLicenseExamplePage />} />
                  <Route path="/theme-preview/cloud" element={<CloudThemePreviewPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    {isSampleLabEnabled() ? <Route path="/sample-lab" element={<SampleLabPage />} /> : null}
                    <Route path="/voice-studio" element={<VoiceStudioPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin/growth" element={<GrowthAdminPage />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </RouteFade>
            <AudioPlayer />
            <Suspense fallback={null}>
              <GenerationActivityPill />
            </Suspense>
            <SiteTextureVeil />
            <Suspense fallback={null}>
              <GrowthUpsellHost />
            </Suspense>
            <Suspense fallback={null}>
              <CommercialLicenseHost />
            </Suspense>
            <Suspense fallback={null}>
              <StripeCheckoutModal />
            </Suspense>
          </LoopsBootstrap>
        </ThemeBootstrap>
      </AuthBootstrap>
    </Router>
  );
}
