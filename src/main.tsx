import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/warm-glass-theme.css";
import "./styles/cover-surface.css";
import "./styles/landing-mobile-v2.css";

import App from "./App";

function ErrorScreen({ title, message }: { title: string; message?: string }) {
  const missingEnv = [
    !import.meta.env.VITE_SUPABASE_URL ? "VITE_SUPABASE_URL" : null,
    !import.meta.env.VITE_SUPABASE_ANON_KEY ? "VITE_SUPABASE_ANON_KEY" : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-pk-bg text-pk-text">
      <div className="mx-auto max-w-lg px-6 py-20">
        <div className="rounded-pk border border-pk-border bg-pk-panel p-6">
          <div className="text-lg font-bold">{title}</div>
          {message ? <div className="mt-3 text-sm text-pk-muted whitespace-pre-wrap">{message}</div> : null}
          {missingEnv.length ? (
            <div className="mt-5 text-xs text-pk-muted">Missing env vars: {missingEnv.join(", ")}.</div>
          ) : (
            <button
              type="button"
              className="mt-5 inline-flex rounded-pk border border-pk-border bg-pk-bg px-4 py-2 text-xs font-semibold text-pk-text hover:bg-white/5"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

class RootErrorBoundary extends Component<{ children: React.ReactNode }, { error: unknown | null }> {
  state = { error: null as unknown | null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const message = this.state.error instanceof Error ? this.state.error.message : String(this.state.error);
      return <ErrorScreen title="Une erreur est survenue" message={message} />;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
