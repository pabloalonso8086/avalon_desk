import logoUrl from "~/assets/avalon_logo.svg";
import { useTranslation } from "~/i18n";

/** App logo at the left of the title bar. It lets clicks through, so it also drags the window. */
export function TitleBarLogo() {
  const t = useTranslation("titleBarLogo");
  return <img className="title-bar__logo" src={logoUrl} alt={t("alt")} draggable={false} />;
}
