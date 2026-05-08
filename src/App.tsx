import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RouteFade } from "@/components/RouteFade";
import { LoopsBootstrap } from "@/components/LoopsBootstrap";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";
import { AppToaster } from "@/components/AppToaster";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Library from "@/pages/Library";
import Pricing from "@/pages/Pricing";
import Settings from "@/pages/Settings";
import { AudioPlayer } from "@/components/AudioPlayer";

export default function App() {
  return (
    <Router>
      <AuthBootstrap>
        <ThemeBootstrap>
          <LoopsBootstrap>
            <AppToaster />
            <RouteFade>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/library" element={<Library />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </RouteFade>
            <AudioPlayer />
          </LoopsBootstrap>
        </ThemeBootstrap>
      </AuthBootstrap>
    </Router>
  );
}
