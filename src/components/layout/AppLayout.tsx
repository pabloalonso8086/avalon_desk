import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";

/** Two-column app layout: menus on the left, main view on the right. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
}
