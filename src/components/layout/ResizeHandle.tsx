import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useTranslation } from "~/i18n";

/** Pixels moved per arrow key press. */
const KEYBOARD_STEP = 16;

/**
 * Draggable separator: a thin border with an invisible, wider grab area.
 * - `horizontal`: vertical line between columns, resizes a width (cursor ↔).
 * - `vertical`: horizontal line between stacked panels, resizes a height (cursor ↕).
 * The resized panel is the one before the separator (left / top).
 * Double-click restores `defaultSize`; arrow keys adjust it when focused.
 * `onResize` fires while moving; `onResizeEnd` once, when the change is done (to save it).
 */
export function ResizeHandle({
  label,
  direction = "horizontal",
  size,
  min,
  max,
  defaultSize,
  onResize,
  onResizeEnd,
}: {
  label: string;
  direction?: "horizontal" | "vertical";
  size: number;
  min: number;
  max: number;
  defaultSize: number;
  onResize: (size: number) => void;
  onResizeEnd: (size: number) => void;
}) {
  const t = useTranslation("resizeHandle");
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ start: 0, startSize: 0, size: 0 });
  const horizontal = direction === "horizontal";
  const bodyClass = horizontal ? "is-resizing-horizontal" : "is-resizing-vertical";

  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  const position = (event: PointerEvent) => (horizontal ? event.clientX : event.clientY);

  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { start: position(event), startSize: size, size };
    setDragging(true);
    document.body.classList.add(bodyClass);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const next = clamp(drag.current.startSize + position(event) - drag.current.start);
    drag.current.size = next;
    onResize(next);
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    document.body.classList.remove(bodyClass);
    if (drag.current.size !== drag.current.startSize) onResizeEnd(drag.current.size);
  }

  function apply(next: number) {
    const value = clamp(next);
    onResize(value);
    onResizeEnd(value);
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    const decrease = horizontal ? "ArrowLeft" : "ArrowUp";
    const increase = horizontal ? "ArrowRight" : "ArrowDown";
    if (event.key === decrease) apply(size - KEYBOARD_STEP);
    else if (event.key === increase) apply(size + KEYBOARD_STEP);
    else return;
    event.preventDefault();
  }

  return (
    <div
      className={[
        "resize-handle",
        `resize-handle--${direction}`,
        dragging ? "resize-handle--active" : "",
      ].join(" ")}
      role="separator"
      aria-label={label}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-valuenow={Math.round(size)}
      aria-valuemin={min}
      aria-valuemax={max}
      title={t("hint")}
      tabIndex={0}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => apply(defaultSize)}
      onKeyDown={key}
    />
  );
}
