import { useEffect, useState } from "react";
import { watchWindowMaximized } from "~/lib/api/window";
import { CloseButton } from "./CloseButton";
import { MaximizeButton } from "./MaximizeButton";
import { MinimizeButton } from "./MinimizeButton";

/** Minimize, maximize/restore and close buttons, at the right of the title bar. */
export function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;
    watchWindowMaximized(setMaximized)
      .then((stop) => {
        if (cancelled) stop();
        else unlisten = stop;
      })
      .catch((error: unknown) => console.error("Could not watch the window state", error));
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  return (
    <div className="window-controls">
      <MinimizeButton />
      <MaximizeButton maximized={maximized} />
      <CloseButton />
    </div>
  );
}
