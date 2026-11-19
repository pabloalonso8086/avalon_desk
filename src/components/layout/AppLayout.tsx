import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "~/i18n";
import { DEFAULT_SIDEBAR_SIZE, getSettings, setSidebarWidth } from "~/lib/api/settings";
import type { PanelSize } from "~/lib/api/settings";
import { MainContent } from "./MainContent";
import { ResizeHandle } from "./ResizeHandle";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "~/components/titlebar/TitleBar";

/**
 * App layout: custom title bar on top and, below it, two columns:
 * menus on the left, main view on the right.
 * The separator between them is draggable; the sidebar size lives in settings.json.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const t = useTranslation("appLayout");
  const [sidebar, setSidebar] = useState<PanelSize>(DEFAULT_SIDEBAR_SIZE);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((settings) => {
        if (!cancelled) setSidebar(settings.layout.sidebar);
      })
      .catch((error: unknown) => console.error("Could not load settings", error));
    return () => {
      cancelled = true;
    };
  }, []);

  function save(width: number) {
    setSidebarWidth(width)
      .then((stored) => {
        if (stored) setSidebar(stored);
      })
      .catch((error: unknown) => console.error("Could not save the sidebar width", error));
  }

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-layout">
        <Sidebar width={sidebar.width} />
        <ResizeHandle
          label={t("resizeSidebar")}
          size={sidebar.width}
          min={sidebar.min_width}
          max={sidebar.max_width}
          defaultSize={sidebar.default_width}
          onResize={(width) => setSidebar((current) => ({ ...current, width }))}
          onResizeEnd={save}
        />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
