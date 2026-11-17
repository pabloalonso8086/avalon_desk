import { useState } from "react";
import { Button } from "~/components/form/Button";
import { FormMessage } from "~/components/form/FormMessage";
import { PathField } from "~/components/form/PathField";
import { TextField } from "~/components/form/TextField";
import { useTranslation } from "~/i18n";
import { createRepo } from "~/lib/api/repos";
import type { Repo } from "~/lib/api/repos";

/**
 * Creates a new repository. It is saved in the `repos` table right away and then
 * linked to the project in the form (the link is saved with the project).
 */
export function NewRepoForm({ onCreated }: { onCreated: (repo: Repo) => void }) {
  const t = useTranslation("newRepoForm");
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function message(code: string): string {
    if (code === "repo_url_required") return t("errorUrlRequired");
    if (code === "repo_url_exists") return t("errorUrlExists");
    return `${t("errorGeneric")} ${code}`;
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const repo = await createRepo(url, path);
      setUrl("");
      setPath("");
      onCreated(repo);
    } catch (reason) {
      setError(message(String(reason)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset
      className="new-repo-form"
      onKeyDown={(event) => {
        // Enter only adds the repository; it must not submit the project form.
        if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        if (!busy && url.trim()) void create();
      }}
    >
      <legend className="new-repo-form__title">{t("title")}</legend>
      <TextField label={t("url")} value={url} onChange={setUrl} />
      <PathField label={t("path")} value={path} onChange={setPath} />
      <div className="form-actions">
        <Button label={t("create")} variant="secondary" disabled={busy || !url.trim()} onClick={() => void create()} />
      </div>
      {error && <FormMessage kind="error" text={error} />}
    </fieldset>
  );
}
