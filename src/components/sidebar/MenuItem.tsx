/**
 * Generic sidebar menu entry. Text that does not fit is cut with "..." (see .menu-item).
 * Receives already-translated text; it has no texts of its own.
 */
export function MenuItem({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = ["menu-item", onClick ? "" : "menu-item--disabled", active ? "menu-item--active" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={className}
      title={label}
      role="menuitem"
      tabIndex={onClick ? 0 : -1}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {label}
    </div>
  );
}
