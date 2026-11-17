import { useState } from "react";
import { Button } from "~/components/form/Button";
import { FormField } from "~/components/form/FormField";
import { useTranslation } from "~/i18n";
import type { Repo } from "~/lib/api/repos";

/** Dropdown with the existing repositories not yet linked to the project. */
export function RepoPicker({ repos, onLink }: { repos: Repo[]; onLink: (repoId: number) => void }) {
  const t = useTranslation("repoPicker");
  const [selected, setSelected] = useState("");

  if (repos.length === 0) {
    return <p className="repo-picker__empty">{t("none")}</p>;
  }

  function link() {
    if (!selected) return;
    onLink(Number(selected));
    setSelected("");
  }

  return (
    <div className="repo-picker">
      <FormField label={t("label")}>
        <select className="form-input" value={selected} onChange={(event) => setSelected(event.target.value)}>
          <option value="">{t("placeholder")}</option>
          {repos.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.url}
            </option>
          ))}
        </select>
      </FormField>
      <Button label={t("link")} variant="secondary" disabled={!selected} onClick={link} />
    </div>
  );
}
