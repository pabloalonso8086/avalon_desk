import type { ReactNode } from "react";

/** Generic title bar button. Receives an already-translated label; it has no texts of its own. */
export function WindowButton({
  label,
  variant = "default",
  onClick,
  children,
}: {
  label: string;
  variant?: "default" | "close";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`window-button window-button--${variant}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
