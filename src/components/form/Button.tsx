/** Generic button. Receives already-translated text. */
export function Button({
  label,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button className={`button button--${variant}`} type={type} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
