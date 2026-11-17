import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "~/i18n";
import { MenuItem } from "./MenuItem";

/** "Settings" menu entry, pinned to the bottom of the sidebar. Opens the Settings view. */
export function SettingsMenuItem() {
  const t = useTranslation("settingsMenuItem");
  const navigate = useNavigate();
  return <MenuItem label={t("label")} onClick={() => void navigate({ to: "/settings" })} />;
}
