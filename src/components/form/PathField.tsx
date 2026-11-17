import { useRef, useState } from "react";
import { useTranslation } from "~/i18n";
import { pathExists, pickFolder } from "~/lib/api/fs";
import { Button } from "./Button";
import { FormField } from "./FormField";

/**
 * Folder path: editable text input plus a "Browse…" button that opens the native
 * folder picker and writes the result into the input.
 * After a manual edit, losing focus checks that the folder exists. If it does not,
 * the border turns red, but saving is never blocked.
 */
export function PathField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslation("pathField");
  const [missing, setMissing] = useState(false);
  const valueOnFocus = useRef(value);

  async function check(path: string) {
    const trimmed = path.trim();
    setMissing(trimmed !== "" && !(await pathExists(trimmed)));
  }

  async function browse() {
    const folder = await pickFolder(t("dialogTitle"), value);
    if (folder === null) return;
    onChange(folder);
    await check(folder);
  }

  return (
    <FormField label={label} error={missing ? t("notFound") : undefined}>
      <span className="path-field">
        <input
          className={missing ? "form-input form-input--error" : "form-input"}
          type="text"
          value={value}
          onFocus={() => {
            valueOnFocus.current = value;
          }}
          onBlur={() => {
            if (value !== valueOnFocus.current) void check(value);
          }}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button label={t("browse")} variant="secondary" onClick={() => void browse()} />
      </span>
    </FormField>
  );
}
