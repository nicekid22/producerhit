import { AppShell } from "@/components/AppShell";
import { DistributionAcademyExperience } from "@/components/academy/DistributionAcademyExperience";
import { useLocaleStore } from "@/stores/localeStore";

export default function DistributionAcademyPage() {
  const locale = useLocaleStore((s) => s.locale);
  const lang = locale === "fr" ? "fr" : "en";

  return (
    <AppShell variant="single" theme="prism">
      <DistributionAcademyExperience locale={lang} variant="in-app" />
    </AppShell>
  );
}
