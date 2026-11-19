import IconMinimize from "~icons/codicon/chrome-minimize";
import { useTranslation } from "~/i18n";
import { minimizeWindow } from "~/lib/api/window";
import { WindowButton } from "./WindowButton";

export function MinimizeButton() {
  const t = useTranslation("minimizeButton");
  return (
    <WindowButton label={t("label")} onClick={() => void minimizeWindow()}>
      <IconMinimize aria-hidden="true" />
    </WindowButton>
  );
}
