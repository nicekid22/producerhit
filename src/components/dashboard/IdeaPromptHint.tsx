import type { AppLocale } from "@/i18n/config";
import { buildDashboardSection } from "@/i18n/dashboardCatalog";

type Props = {
  locale: AppLocale;
  visible: boolean;
};

export function IdeaPromptHint({ locale, visible }: Props) {
  if (!visible) return null;
  const d = buildDashboardSection(locale);
  return (
    <p className="mt-1.5 text-xs leading-relaxed text-pk-muted" role="note">
      {d.ideaPromptHint}
    </p>
  );
}
