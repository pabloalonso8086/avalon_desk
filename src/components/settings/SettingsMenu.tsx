import { useTranslation } from "~/i18n";
import { SettingsMenuEntry } from "./SettingsMenuEntry";

/** Available settings, in menu order. Each key is also its text key in i18n (`settingsMenu`). */
export const SETTINGS = ["projects"] as const;
export type SettingId = (typeof SETTINGS)[number];

/** Left column of the Settings view: vertical `<ul>` menu. */
export function SettingsMenu({
  active,
  onSelect,
}: {
  active: SettingId;
  onSelect: (setting: SettingId) => void;
}) {
  const t = useTranslation("settingsMenu");
  return (
    <ul className="settings-menu" role="menu">
      {SETTINGS.map((setting) => (
        <SettingsMenuEntry
          key={setting}
          label={t(setting)}
          active={setting === active}
          onClick={() => onSelect(setting)}
        />
      ))}
    </ul>
  );
}
