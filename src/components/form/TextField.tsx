import { FormField } from "./FormField";

/** Labelled text input. Receives already-translated texts. */
export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <FormField label={label} hint={hint}>
      <input
        className="form-input"
        type="text"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
