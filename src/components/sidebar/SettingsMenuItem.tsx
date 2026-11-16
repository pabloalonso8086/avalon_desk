import { useTranslation } from "~/i18n";
import { MenuItem } from "./MenuItem";

/** "Settings" menu entry, pinned to the bottom of the sidebar. No functionality yet. */
export function SettingsMenuItem() {
  const t = useTranslation("settingsMenuItem");
  return <MenuItem label={t("label")} />;
}
