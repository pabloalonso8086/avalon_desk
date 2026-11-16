import { AppLogo } from "~/components/sidebar/AppLogo";
import { HomeMenuItem } from "~/components/sidebar/HomeMenuItem";
import { ProjectMenu } from "~/components/sidebar/ProjectMenu";
import { SettingsMenuItem } from "~/components/sidebar/SettingsMenuItem";

/** Left column: logo, Home, scrollable project list and Settings at the bottom. */
export function Sidebar() {
  return (
    <nav className="sidebar">
      <AppLogo />
      <HomeMenuItem />
      <ProjectMenu />
      <div className="sidebar__footer">
        <SettingsMenuItem />
      </div>
    </nav>
  );
}
