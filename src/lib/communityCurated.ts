import type { PublicLoopRow } from "@/lib/publicLoops";

/**
 * Démos publiques épinglées (URLs Storage stables) — la communauté ne doit jamais paraître vide.
 * IDs = vraies loops `is_public` en DB (lecture + remix OK).
 */
export const CURATED_COMMUNITY_LOOPS: PublicLoopRow[] = [
  {
    id: "1a9bd538-ecd8-42a4-94b3-accf8d90622a",
    name: "Amapiano #01",
    genre: "Amapiano",
    mood: "",
    bpm: 111,
    prompt: "Amapiano, vocal style: Singer",
    audio_url:
      "https://pmfnzenqemnonpglmjqx.supabase.co/storage/v1/object/public/loop-audio/7ce66a37-8b7e-49a4-a38b-a120a5074b71/1a9bd538-ecd8-42a4-94b3-accf8d90622a.wav",
    created_at: "2026-05-27T18:37:16.226546+00:00",
    stems_url: null,
  },
  {
    id: "64bae205-a5a8-40c3-af0c-390d2e34bbf7",
    name: "Amapiano #02",
    genre: "Amapiano",
    mood: "",
    bpm: 111,
    prompt: "Amapiano, vocal style: Singer",
    audio_url:
      "https://pmfnzenqemnonpglmjqx.supabase.co/storage/v1/object/public/loop-audio/7ce66a37-8b7e-49a4-a38b-a120a5074b71/64bae205-a5a8-40c3-af0c-390d2e34bbf7.wav",
    created_at: "2026-05-27T18:37:01.407713+00:00",
    stems_url: null,
  },
  {
    id: "3243329e-4462-4911-bb67-ba2cade00817",
    name: "Soul #02",
    genre: "Soul",
    mood: "",
    bpm: 64,
    prompt: "Soul, vocal style: Singer",
    audio_url:
      "https://pmfnzenqemnonpglmjqx.supabase.co/storage/v1/object/public/loop-audio/7ce66a37-8b7e-49a4-a38b-a120a5074b71/3243329e-4462-4911-bb67-ba2cade00817.wav",
    created_at: "2026-05-27T18:30:24.364955+00:00",
    stems_url: null,
  },
  {
    id: "0ead626a-ffb3-4bbd-bbb1-b115f409f4d7",
    name: "Old School Hip-hop #01",
    genre: "Old School Hip-Hop",
    mood: "",
    bpm: 91,
    prompt: "Old School Hip-Hop, vocal style: Singer",
    audio_url:
      "https://pmfnzenqemnonpglmjqx.supabase.co/storage/v1/object/public/loop-audio/7ce66a37-8b7e-49a4-a38b-a120a5074b71/0ead626a-ffb3-4bbd-bbb1-b115f409f4d7.wav",
    created_at: "2026-05-27T18:01:59.94061+00:00",
    stems_url: null,
  },
  {
    id: "a7d38c96-2c6d-403a-8a67-6e6ff259e868",
    name: "Cloud Rap #25",
    genre: "Cloud Rap",
    mood: "",
    bpm: 91,
    prompt: "Cloud Rap, vocal style: Singer",
    audio_url:
      "https://pmfnzenqemnonpglmjqx.supabase.co/storage/v1/object/public/loop-audio/7ce66a37-8b7e-49a4-a38b-a120a5074b71/a7d38c96-2c6d-403a-8a67-6e6ff259e868.wav",
    created_at: "2026-05-27T17:55:44.868485+00:00",
    stems_url: null,
  },
  {
    id: "63525b41-9c76-4d1d-a188-2800f4011d9c",
    name: "Emo Trap #01",
    genre: "Emo Trap",
    mood: "",
    bpm: 91,
    prompt: "vocal style: Singer",
    audio_url:
      "https://pmfnzenqemnonpglmjqx.supabase.co/storage/v1/object/public/loop-audio/8d10382c-3858-4609-aa06-79d98c704e00/63525b41-9c76-4d1d-a188-2800f4011d9c.wav",
    created_at: "2026-06-01T17:41:30.631816+00:00",
    stems_url: null,
  },
];

export const CURATED_COMMUNITY_MIN_COUNT = 6;
