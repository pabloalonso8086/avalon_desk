import { FormField } from "./FormField";

/** Labelled date input. `value` uses the `YYYY-MM-DD` format; empty means no date. */
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <input
        className="form-input"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
