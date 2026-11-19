import { HomeMenuItem } from "~/components/sidebar/HomeMenuItem";
import { ProjectMenu } from "~/components/sidebar/ProjectMenu";
import { SettingsMenuItem } from "~/components/sidebar/SettingsMenuItem";

/** Left column: Home, scrollable project list and Settings at the bottom. Width in px. */
export function Sidebar({ width }: { width: number }) {
  return (
    <nav className="sidebar" style={{ width }}>
      <HomeMenuItem />
      <ProjectMenu />
      <div className="sidebar__footer">
        <SettingsMenuItem />
      </div>
    </nav>
  );
}
