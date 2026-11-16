import type { ReactNode } from "react";

/** Right column: container for the main view. */
export function MainContent({ children }: { children: ReactNode }) {
  return <main className="main-content">{children}</main>;
}
