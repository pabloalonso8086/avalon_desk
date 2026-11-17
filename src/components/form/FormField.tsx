import type { ReactNode } from "react";

/**
 * Label + control + optional hint/error. Receives already-translated texts;
 * it has no texts of its own.
 */
export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      {children}
      {error ? (
        <span className="form-field__error">{error}</span>
      ) : hint ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
    </label>
  );
}
