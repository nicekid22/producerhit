import { PLAN_LIMITS } from "@/lib/planLimits";

/** Bonus added to referee's monthly quota when they sign up via a referral link. */
export const REFERRAL_REFEREE_BONUS = 10;

/** Bonus granted to referrer when a referred user signs up via their link (one time). */
export const REFERRAL_REFERRER_SIGNUP_BONUS = 20;

/** @deprecated Renamed — use REFERRAL_REFERRER_SIGNUP_BONUS. */
export const REFERRAL_REFERRER_PLUS_BONUS = REFERRAL_REFERRER_SIGNUP_BONUS;

export const REFERRAL_REFERRER_BONUS = REFERRAL_REFERRER_SIGNUP_BONUS;

/** Free plan base generations — referee also gets this before bonus. */
export const REFERRAL_FREE_BASE = PLAN_LIMITS.free;

/** Total generations a referred new user starts with (free base + referral bonus). */
export const REFERRAL_REFEREE_START_TOTAL = REFERRAL_FREE_BASE + REFERRAL_REFEREE_BONUS;

export const REFERRAL_PROMPT_STORAGE_KEY = "producerhit_referral_prompt_shown_v1";
