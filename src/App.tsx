import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RouteFade } from "@/components/RouteFade";
import { LoopsBootstrap } from "@/components/LoopsBootstrap";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";
import { AppToaster } from "@/components/AppToaster";
import { LootRevealModal } from "@/components/growth/LootRevealModal";
import { GrowthUpsellHost } from "@/components/growth/GrowthUpsellHost";
import { ReferralReferrerWatcher } from "@/components/growth/ReferralReferrerWatcher";
import { SeoBootstrap } from "@/components/SeoBootstrap";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { loaderIconFromPath } from "@/lib/loaderIcons";
import { AudioPlayer } from "@/components/AudioPlayer";
import { SiteTextureVeil } from "@/components/SiteTextureVeil";
import { useLocaleStore } from "@/stores/localeStore";
import { isSampleLabEnabled } from "@/lib/sampleLab";
import { COMPARISON_PAGE_PATHS, SEO_PAGE_PATHS } from "@/generated/marketingRoutePaths";
import { GrowthBootstrap } from "@/components/GrowthBootstrap";
import { PlayerDockBootstrap } from "@/components/PlayerDockBootstrap";

const LandingPage = lazy(() => import("@/pages/Landing"));
const HomePage = lazy(() => import("@/pages/Home"));
const ComparePage = lazy(() => import("@/pages/ComparePage"));
const BlogPage = lazy(() => import("@/pages/Blog"));
const ExplorePage = lazy(() => import("@/pages/Explore"));
const PublicLoopPage = lazy(() => import("@/pages/PublicLoop"));
const CreatorProfilePage = lazy(() => import("@/pages/CreatorProfile"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const AuthPage = lazy(() => import("@/pages/Auth"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallback"));
const PricingPage = lazy(() => import("@/pages/Pricing"));
const LegalPage = lazy(() => import("@/pages/Legal"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const LibraryPage = lazy(() => import("@/pages/Library"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const GrowthAdminPage = lazy(() => import("@/pages/GrowthAdmin"));
const SampleLabPage = lazy(() => import("@/pages/SampleLab"));

function PageLoader() {
  const { pathname } = useLocation();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const icon = loaderIconFromPath(pathname);

  return (
    <div className="pk-page-loader grid min-h-[70vh] place-items-center px-6 py-16">
      <PkIconLoader
        icon={icon}
        size="lg"
        label={isFr ? "Chargement…" : "Loading…"}
        sublabel={isFr ? "On prépare ton studio" : "Setting up your studio"}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthBootstrap>
        <ThemeBootstrap>
          <LoopsBootstrap>
            <AppToaster />
            <LootRevealModal />
            <ReferralReferrerWatcher />
            <SeoBootstrap />
            <GrowthBootstrap />
            <PlayerDockBootstrap />
            <RouteFade>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/community" element={<ExplorePage />} />
                  <Route path="/loop/:id" element={<PublicLoopPage />} />
                  <Route path="/u/:username" element={<CreatorProfilePage />} />
                  <Route path="/blog" element={<BlogPage />} />
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

                  <Route path="/dashboard" element={<DashboardPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/library" element={<LibraryPage />} />
                    {isSampleLabEnabled() ? <Route path="/sample-lab" element={<SampleLabPage />} /> : null}
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin/growth" element={<GrowthAdminPage />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </RouteFade>
            <AudioPlayer />
            <SiteTextureVeil />
            <GrowthUpsellHost />
          </LoopsBootstrap>
        </ThemeBootstrap>
      </AuthBootstrap>
    </Router>
  );
}
