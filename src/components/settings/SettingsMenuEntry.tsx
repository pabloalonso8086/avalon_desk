/** One entry of the settings menu. Receives already-translated text. */
export function SettingsMenuEntry({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li
      className={active ? "settings-menu__entry settings-menu__entry--active" : "settings-menu__entry"}
      title={label}
      role="menuitem"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {label}
    </li>
  );
}
