/**
 * Generic sidebar menu entry. Text that does not fit is cut with "..." (see .menu-item).
 * Receives already-translated text; it has no texts of its own.
 */
export function MenuItem({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <div
      className={onClick ? "menu-item" : "menu-item menu-item--disabled"}
      title={label}
      role="menuitem"
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
    >
      {label}
    </div>
  );
}
