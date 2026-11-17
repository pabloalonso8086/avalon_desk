/** Window event fired when projects are created or updated, so menus can reload. */
export const PROJECTS_CHANGED = "avalon:projects-changed";

export function notifyProjectsChanged(): void {
  window.dispatchEvent(new Event(PROJECTS_CHANGED));
}
