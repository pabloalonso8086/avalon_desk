import IconClose from "~icons/codicon/chrome-close";
import { useTranslation } from "~/i18n";
import { closeWindow } from "~/lib/api/window";
import { WindowButton } from "./WindowButton";

export function CloseButton() {
  const t = useTranslation("closeButton");
  return (
    <WindowButton label={t("label")} variant="close" onClick={() => void closeWindow()}>
      <IconClose aria-hidden="true" />
    </WindowButton>
  );
}
