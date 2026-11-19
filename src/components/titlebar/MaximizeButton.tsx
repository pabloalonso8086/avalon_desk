import IconMaximize from "~icons/codicon/chrome-maximize";
import IconRestore from "~icons/codicon/chrome-restore";
import { useTranslation } from "~/i18n";
import { toggleMaximizeWindow } from "~/lib/api/window";
import { WindowButton } from "./WindowButton";

/** Maximizes the window, or restores it when it is already maximized. */
export function MaximizeButton({ maximized }: { maximized: boolean }) {
  const t = useTranslation("maximizeButton");
  return (
    <WindowButton label={maximized ? t("restore") : t("maximize")} onClick={() => void toggleMaximizeWindow()}>
      {maximized ? <IconRestore aria-hidden="true" /> : <IconMaximize aria-hidden="true" />}
    </WindowButton>
  );
}
