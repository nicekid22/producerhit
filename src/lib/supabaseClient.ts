export {
  supabase,
  isUsingFirebase,
  isUsingBackup,
  isBackupConfigured,
  switchToBackup,
  switchToFirebase,
  exitFirebaseFallback,
  switchToPrimary,
  trackClientEvent,
  flushEventQueue,
  flushClientEvents,
  getSupabaseTokenForFirebaseUser,
} from "@/lib/firebaseSupabaseClient";
