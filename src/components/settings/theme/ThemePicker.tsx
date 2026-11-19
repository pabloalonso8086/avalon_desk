import { useTranslation } from "~/i18n";
import { THEMES } from "~/styles/themes";
import type { Theme } from "~/styles/themes";
import { ThemeOption } from "./ThemeOption";

/** Group of theme miniatures. Clicking one selects that theme. */
export function ThemePicker({ value, onChange }: { value: Theme; onChange: (theme: Theme) => void }) {
  const t = useTranslation("themePicker");
  return (
    <div className="theme-picker" role="radiogroup" aria-label={t("label")}>
      {THEMES.map((theme) => (
        <ThemeOption key={theme} theme={theme} selected={theme === value} onSelect={() => onChange(theme)} />
      ))}
    </div>
  );
}
