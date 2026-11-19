import { useState } from "react";
import { ProjectSettings } from "./projects/ProjectSettings";
import { ThemeSettings } from "./theme/ThemeSettings";
import { SETTINGS, SettingsMenu } from "./SettingsMenu";
import type { SettingId } from "./SettingsMenu";

/**
 * Settings view: menu on the left, selected setting on the right.
 * Clicking a menu entry (even the active one) remounts its panel, which reloads it
 * and discards unsaved changes.
 */
export function SettingsView() {
  const [active, setActive] = useState<SettingId>(SETTINGS[0]);
  const [resetKey, setResetKey] = useState(0);

  function select(setting: SettingId) {
    setActive(setting);
    setResetKey((key) => key + 1);
  }

  return (
    <div className="settings-view">
      <aside className="settings-view__menu">
        <SettingsMenu active={active} onSelect={select} />
      </aside>
      <section className="settings-view__panel">
        {active === "theme" && <ThemeSettings key={resetKey} />}
        {active === "projects" && <ProjectSettings key={resetKey} />}
      </section>
    </div>
  );
}
