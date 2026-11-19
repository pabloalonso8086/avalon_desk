import type { Theme } from "~/styles/themes";

/**
 * Small sketch of the app painted with the theme's own variables:
 * sidebar with menu entries on the left, main view with text, an input and a button.
 * Decorative only (no texts).
 */
export function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <span className="theme-preview" data-theme={theme} aria-hidden="true">
      <span className="theme-preview__sidebar">
        <span className="theme-preview__logo" />
        <span className="theme-preview__menu-item theme-preview__menu-item--active" />
        <span className="theme-preview__menu-item" />
        <span className="theme-preview__menu-item" />
      </span>
      <span className="theme-preview__separator" />
      <span className="theme-preview__main">
        <span className="theme-preview__title" />
        <span className="theme-preview__text" />
        <span className="theme-preview__input" />
        <span className="theme-preview__button" />
      </span>
    </span>
  );
}
