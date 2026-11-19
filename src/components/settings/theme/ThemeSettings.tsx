import { useState } from "react";
import { FormMessage } from "~/components/form/FormMessage";
import { useTranslation } from "~/i18n";
import { useTheme } from "~/styles/themes/ThemeProvider";
import type { Theme } from "~/styles/themes";
import { ThemePicker } from "./ThemePicker";

/**
 * "Theme" setting. Stored in `settings.json` (`theme`).
 * The chosen theme is applied at once and saved.
 */
export function ThemeSettings() {
  const t = useTranslation("themeSettings");
  const { theme, setTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  function change(next: Theme) {
    setError(null);
    setTheme(next).catch((reason: unknown) => setError(String(reason)));
  }

  return (
    <div className="settings-panel">
      <section className="theme-settings">
        <h2 className="settings-panel__title">{t("title")}</h2>
        <ThemePicker value={theme} onChange={change} />
        {error && <FormMessage kind="error" text={`${t("saveError")} ${error}`} />}
      </section>
    </div>
  );
}
