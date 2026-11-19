import { useTranslation } from "~/i18n";
import type { Theme } from "~/styles/themes";
import { ThemePreview } from "./ThemePreview";

/** One selectable theme: its miniature and its name. */
export function ThemeOption({
  theme,
  selected,
  onSelect,
}: {
  theme: Theme;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslation("themeOption");
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={selected ? "theme-option theme-option--selected" : "theme-option"}
      onClick={onSelect}
    >
      <ThemePreview theme={theme} />
      <span className="theme-option__name">{t(theme)}</span>
    </button>
  );
}
