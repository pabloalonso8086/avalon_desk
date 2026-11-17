import { FormField } from "~/components/form/FormField";
import type { Status } from "~/lib/api/statuses";

/** Status dropdown. Status names come from the database and are shown as they are. */
export function StatusSelect({
  label,
  statuses,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  statuses: Status[];
  value: number | null;
  onChange: (statusId: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <FormField label={label} hint={hint}>
      <select
        className="form-input"
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
    </FormField>
  );
}
