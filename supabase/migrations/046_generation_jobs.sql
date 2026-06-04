-- Jobs de génération ACE async (poll client + Realtime)

CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_key text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  mode text,
  ace_task_id text,
  ace_base_url text,
  ace_key_index int NOT NULL DEFAULT 0,
  audio_url text,
  meta jsonb,
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS generation_jobs_user_created_idx
  ON public.generation_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS generation_jobs_status_idx
  ON public.generation_jobs (status)
  WHERE status IN ('pending', 'running');

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS generation_jobs_select_own ON public.generation_jobs;
CREATE POLICY generation_jobs_select_own ON public.generation_jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS generation_jobs_insert_own ON public.generation_jobs;
CREATE POLICY generation_jobs_insert_own ON public.generation_jobs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Mises à jour : Edge (service role) + utilisateur sur ses lignes
DROP POLICY IF EXISTS generation_jobs_update_own ON public.generation_jobs;
CREATE POLICY generation_jobs_update_own ON public.generation_jobs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_generation_job_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IN ('completed', 'failed') AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generation_jobs_updated_at ON public.generation_jobs;
CREATE TRIGGER generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_generation_job_updated_at();

-- Realtime : notifier le client quand le MP3 est prêt
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'generation_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
