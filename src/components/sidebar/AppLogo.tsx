import { useTranslation } from "~/i18n";
import logoUrl from "~/assets/avalon_logo.svg";

export function AppLogo() {
  const t = useTranslation("appLogo");
  return (
    <div className="app-logo">
      <img className="app-logo__image" src={logoUrl} alt={t("alt")} />
      <span className="app-logo__name">{t("name")}</span>
    </div>
  );
}
