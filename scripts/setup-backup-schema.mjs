/**
 * Setup du projet Supabase backup — crée les tables et applique les migrations.
 *
 * À lancer UNE SEULE FOIS après la création du projet backup, ou à chaque fois
 * qu'on veut s'assurer que le backup a le même schéma que le primary.
 *
 * IMPORTANT: Ce script écrit UNIQUEMENT sur le backup. Jamais sur le primary.
 *
 * Usage:
 *   node scripts/setup-backup-schema.mjs [--dry-run] [--drop-first]
 *
 * Options:
 *   --dry-run   : affiche ce qui serait fait sans exécuter
 *   --drop-first: drop les tables existantes avant de les recréer (danger!)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const dropFirst = process.argv.includes("--drop-first");

function loadEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local")];
  const path = candidates.find((p) => existsSync(p));
  const env = { ...process.env };
  if (!path) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();

const BACKUP_URL = env.VITE_SUPABASE_BACKUP_URL;
const BACKUP_KEY = env.VITE_SUPABASE_BACKUP_SERVICE_KEY;

if (!BACKUP_URL || !BACKUP_KEY) {
  console.error("Missing VITE_SUPABASE_BACKUP_URL or VITE_SUPABASE_BACKUP_SERVICE_KEY");
  process.exit(1);
}

// Le format sb_* bypass RLS — on peut créer des tables sans config supplémentaire
const backup = createClient(BACKUP_URL, BACKUP_KEY, { auth: { persistSession: false } });

// ─── Schéma minimal pour les tables syncées ────────────────────────────────

const SCHEMA_SQL = `
// ── profiles ───────────────────────────────────────────────────────────────
${dropFirst ? "drop table if exists public.profiles cascade;\n" : ""}
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  plan        text default 'free',
  username    text,
  avatar_id   integer default 1,
  creator_type text,
  bio         text,
  loops_used_this_month int default 0,
  referral_bonus int default 0,
  purchased_bonus int default 0,
  level_bonus int default 0,
  daily_bonus_month int default 0,
  referral_code text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert with check (true);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (true);

// ── loops ──────────────────────────────────────────────────────────────────
${dropFirst ? "drop table if exists public.loops cascade;\n" : ""}
create table if not exists public.loops (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id),
  name             text,
  genre            text,
  bpm              integer,
  mood             text,
  key_sig          text,
  scale            text,
  cover_url        text,
  audio_url        text,
  is_public        boolean default false,
  is_saved         boolean default false,
  created_at       timestamptz default now(),
  loop_length      integer,
  energy_level     integer default 5,
  influence        text
);

alter table public.loops enable row level security;
drop policy if exists "loops_select" on public.loops;
create policy "loops_select" on public.loops for select using (true);
drop policy if exists "loops_insert" on public.loops;
create policy "loops_insert" on public.loops for insert with check (true);
drop policy if exists "loops_update" on public.loops;
create policy "loops_update" on public.loops for update using (true);

// ── generation_usage_keys ───────────────────────────────────────────────────
${dropFirst ? "drop table if exists public.generation_usage_keys cascade;\n" : ""}
create table if not exists public.generation_usage_keys (
  user_id        uuid references public.profiles(id),
  key            text,
  used_count     integer default 0,
  created_at     timestamptz default now(),
  primary key (user_id, key)
);

alter table public.generation_usage_keys enable row level security;
drop policy if exists "guk_select" on public.generation_usage_keys;
create policy "guk_select" on public.generation_usage_keys for select using (true);
drop policy if exists "guk_insert" on public.generation_usage_keys;
create policy "guk_insert" on public.generation_usage_keys for insert with check (true);
drop policy if exists "guk_update" on public.generation_usage_keys;
create policy "guk_update" on public.generation_usage_keys for update using (true);

// ── growth_events ─────────────────────────────────────────────────────────
${dropFirst ? "drop table if exists public.growth_events cascade;\n" : ""}
create table if not exists public.growth_events (
  id          bigint generated always as identity primary key,
  session_id  text,
  user_id     uuid references public.profiles(id),
  name        text not null,
  props       jsonb,
  path        text,
  client_ts   timestamptz,
  created_at  timestamptz default now()
);

create index if not exists growth_events_session_created_idx
  on public.growth_events (session_id, created_at desc);

alter table public.growth_events enable row level security;
drop policy if exists "ge_select" on public.growth_events;
create policy "ge_select" on public.growth_events for select using (true);
drop policy if exists "ge_insert" on public.growth_events;
create policy "ge_insert" on public.growth_events for insert with check (true);

// ── generation_jobs (pour la sync, pas pour les jobs actifs) ──────────────
${dropFirst ? "drop table if exists public.generation_jobs cascade;\n" : ""}
create table if not exists public.generation_jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id),
  status     text default 'pending',
  audio_url  text,
  params     jsonb,
  error      text,
  created_at timestamptz default now()
);

create index if not exists generation_jobs_status_created_idx
  on public.generation_jobs (status, created_at desc);

alter table public.generation_jobs enable row level security;
drop policy if exists "gj_select" on public.generation_jobs;
create policy "gj_select" on public.generation_jobs for select using (true);
drop policy if exists "gj_insert" on public.generation_jobs;
create policy "gj_insert" on public.generation_jobs for insert with check (true);

// ── discord_bot_events ──────────────────────────────────────────────────────
${dropFirst ? "drop table if exists public.discord_bot_events cascade;\n" : ""}
create table if not exists public.discord_bot_events (
  id         bigint generated always as identity primary key,
  event_type text not null,
  payload    jsonb,
  ok         boolean default false,
  created_at timestamptz default now()
);

create index if not exists discord_bot_events_type_created_idx
  on public.discord_bot_events (event_type, created_at desc);

alter table public.discord_bot_events enable row level security;
drop policy if exists "dbe_select" on public.discord_bot_events;
create policy "dbe_select" on public.discord_bot_events for select using (true);
drop policy if exists "dbe_insert" on public.discord_bot_events;
create policy "dbe_insert" on public.discord_bot_events for insert with check (true);
`;

async function runSQL(sql) {
  // Supabase backup = format sb_* → API Management via REST endpoint
  // On utilise le même pattern que cleanup-generation-jobs.mjs
  const projectRef = BACKUP_URL.match(/https?:\/\/([^.]+)\./)?.[1];
  if (!projectRef) throw new Error("Can't extract project ref from URL");

  // Le format sb_ a un secret différent — on l'utilise directement
  const r = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BACKUP_KEY}`,
        "Content-Type": "application/json",
        apikey: BACKUP_KEY,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const text = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${text.slice(0, 300)}`);
  return text;
}

async function main() {
  console.log(dryRun ? "=== DRY RUN ===" : "=== SETUP BACKUP SCHEMA ===");
  console.log(`Backup: ${BACKUP_URL}`);

  // Vérifier la connexion
  console.log("\n1. Vérification de la connexion...");
  const { error: pingErr } = await backup.from("profiles").select("id").limit(1);
  if (pingErr && !pingErr.message.includes("does not exist")) {
    console.error("  Connexion impossible:", pingErr.message);
    process.exit(1);
  }
  console.log("  ✅ Connexion OK");

  // Appliquer le schéma
  console.log("\n2. Création des tables et index...");
  if (dryRun) {
    console.log("  [DRY RUN] Exécution SQL:\n" + SCHEMA_SQL.slice(0, 500) + "...");
  } else {
    const result = await runSQL(SCHEMA_SQL);
    console.log("  ✅ Schéma appliqué:", result.slice(0, 200));
  }

  console.log("\n=== DONE ===");
  console.log("\nProchaine étape:");
  console.log("  node scripts/sync-backup-supabase.mjs    #populate le backup depuis primary");
}

main().catch((e) => {
  console.error("Setup failed:", e.message);
  process.exit(1);
});