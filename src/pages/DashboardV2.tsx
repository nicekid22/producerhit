/**
 * DashboardV2 — Page de test Apple Style (thème Prism)
 * Wrape le Dashboard existant avec la classe pk-dashboard-v2
 * Ne pas intégrer sur le site principal avant validation.
 */
import "@/styles/dashboard-v2-apple.css";
import Dashboard from "./Dashboard";

export default function DashboardV2() {
  return (
    <div className="pk-dashboard-v2">
      <Dashboard />
    </div>
  );
}
