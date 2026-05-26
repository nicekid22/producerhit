/** Mobile Dashboard v2 — onglets Créer/Résultats, dock unifié. Désactiver avec VITE_MOBILE_DASHBOARD_V2=0 */
export const MOBILE_DASHBOARD_V2 =
  import.meta.env.VITE_MOBILE_DASHBOARD_V2 === "1" ||
  (import.meta.env.DEV && import.meta.env.VITE_MOBILE_DASHBOARD_V2 !== "0");
