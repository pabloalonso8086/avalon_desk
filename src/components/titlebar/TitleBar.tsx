import { TitleBarLogo } from "./TitleBarLogo";
import { WindowControls } from "./WindowControls";

/**
 * Custom title bar (the native frame is disabled), VS Code style: thin, full width.
 * The whole bar drags the window and double-clicking it maximizes or restores it.
 */
export function TitleBar() {
  return (
    <header className="title-bar" data-tauri-drag-region>
      <TitleBarLogo />
      <div className="title-bar__drag" data-tauri-drag-region />
      <WindowControls />
    </header>
  );
}
