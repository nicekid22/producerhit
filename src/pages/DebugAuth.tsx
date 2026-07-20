/**
 * Page de diagnostic temporaire — à supprimer après utilisation
 * Accessible sur /debug-auth en production
 * Affiche la config Supabase et teste la connexion
 */
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

function DebugPage() {
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const run = async () => {
      const r: Record<string, string> = {};

      // 1. Variables d'environnement
      r["VITE_SUPABASE_URL"] = import.meta.env.VITE_SUPABASE_URL ?? "❌ MANQUANTE";
      r["VITE_SUPABASE_ANON_KEY"] = import.meta.env.VITE_SUPABASE_ANON_KEY
        ? `✅ ${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 15)}...`
        : "❌ MANQUANTE";

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        r["DIAGNOSTIC"] = "❌ Variables Supabase MANQUANTES dans Vercel!";
        setResults(r);
        return;
      }

      // 2. Test Supabase REST API
      try {
        const healthRes = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        r["Supabase REST API"] = healthRes.ok ? "✅ Accessible" : `❌ Status ${healthRes.status}`;
      } catch (e: unknown) {
        r["Supabase REST API"] = `❌ ${e instanceof Error ? e.message : String(e)}`;
      }

      // 3. Test Supabase Auth Health
      try {
        const authRes = await fetch(`${supabaseUrl}/auth/v1/health`, {
          headers: {
            apikey: supabaseKey,
          },
        });
        const text = await authRes.text();
        r["Supabase Auth Health"] = authRes.ok
          ? `✅ ${text}`
          : `❌ Status ${authRes.status}: ${text.slice(0, 100)}`;
      } catch (e: unknown) {
        r["Supabase Auth Health"] = `❌ ${e instanceof Error ? e.message : String(e)}`;
      }

      // 4. Test création client
      try {
        const testClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });
        const { error } = await testClient.auth.getSession();
        r["Client Supabase init"] = error ? `⚠️ ${error.message}` : "✅ Client initialisé";
      } catch (e: unknown) {
        r["Client Supabase init"] = `❌ ${e instanceof Error ? e.message : String(e)}`;
      }

      // 5. Test d'authentification avec test credentials
      try {
        const testClient2 = createClient(supabaseUrl, supabaseKey);
        const { error } = await testClient2.auth.signInWithPassword({
          email: "test@producerhit.com",
          password: "test123",
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            r["Email Login"] = "✅ API répond (credentiels test incorrectes - normal)";
          } else {
            r["Email Login"] = `⚠️ ${error.message}`;
          }
        } else {
          r["Email Login"] = "✅ Login réussi (inattendu avec ces creds)";
        }
      } catch (e: unknown) {
        r["Email Login Test"] = `❌ ${e instanceof Error ? e.message : String(e)}`;
      }

      r["DIAGNOSTIC"] = "✅ Tous les tests complétés";

      setResults(r);
    };

    void run();
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0a0a0f",
        color: "#e0e0e0",
        fontFamily: "monospace",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
        🔍 Diagnostic Auth — ProducerHit
      </h1>

      {Object.entries(results).map(([key, value]) => (
        <div
          key={key}
          style={{
            padding: "0.75rem",
            marginBottom: "0.5rem",
            background: "#1a1a24",
            borderRadius: "8px",
            borderLeft: value.startsWith("❌") ? "4px solid #ef4444" : "4px solid #22c55e",
          }}
        >
          <strong style={{ color: "#a78bfa" }}>{key}</strong>
          <br />
          <span style={{ color: value.startsWith("❌") ? "#fca5a5" : "#86efac" }}>{value}</span>
        </div>
      ))}

      {Object.keys(results).length === 0 && (
        <div style={{ color: "#a78bfa" }}>Chargement des tests...</div>
      )}

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "#1a1a24",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>📋 Checklist</h2>
        <ul style={{ lineHeight: "1.8", paddingLeft: "1.5rem" }}>
          <li>Vérifier le dashboard Vercel → Environment Variables</li>
          <li>
            <code>VITE_SUPABASE_URL</code> = <code>{import.meta.env.VITE_SUPABASE_URL ?? "❌"}</code>
          </li>
          <li>
            <code>VITE_SUPABASE_ANON_KEY</code> ={" "}
            {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Configurée" : "❌ MANQUANTE"}
          </li>
          <li>Dashboard Supabase → Authentication → URL Configuration</li>
          <li>
            Ajouter <code>https://www.producerhit.com/auth/callback</code> aux redirect URLs
          </li>
          <li>Dashboard Supabase → Authentication → Providers → Google</li>
          <li>Activer Google OAuth et configurer les credentials</li>
        </ul>
      </div>
    </div>
  );
}

export default function DebugAuth() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<DebugPage />} />
      </Routes>
    </BrowserRouter>
  );
}