import { useTranslation } from "~/i18n";
import { MenuItem } from "./MenuItem";

/** "Home" menu entry. No functionality yet. */
export function HomeMenuItem() {
  const t = useTranslation("homeMenuItem");
  return <MenuItem label={t("label")} />;
}
