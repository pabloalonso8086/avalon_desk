/** Result message of a form (success or error). Receives already-translated text. */
export function FormMessage({ kind, text }: { kind: "success" | "error"; text: string }) {
  return (
    <p className={`form-message form-message--${kind}`} role={kind === "error" ? "alert" : "status"}>
      {text}
    </p>
  );
}
