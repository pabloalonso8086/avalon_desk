import { useState } from "react";
import { ResizeHandle } from "~/components/layout/ResizeHandle";
import { useTranslation } from "~/i18n";
import { Minion } from "./Minion";
import { ToDo } from "./todo/ToDo";

/** Width of the ToDo column (px). Not persisted. */
const TODO_WIDTH = { default: 480, min: 240, max: 960 };

/**
 * View of one project: ToDo on the left, minion on the right, with a draggable separator.
 * Hidden (not unmounted) while another project or view is active.
 */
export function MainView({ projectId, active }: { projectId: number; active: boolean }) {
  const t = useTranslation("mainView");
  const [todoWidth, setTodoWidth] = useState(TODO_WIDTH.default);

  return (
    <div className="main-view" hidden={!active}>
      <section className="main-view__todo" style={{ width: todoWidth }}>
        <ToDo projectId={projectId} active={active} />
      </section>
      <ResizeHandle
        label={t("resizeColumns")}
        size={todoWidth}
        min={TODO_WIDTH.min}
        max={TODO_WIDTH.max}
        defaultSize={TODO_WIDTH.default}
        onResize={setTodoWidth}
        onResizeEnd={setTodoWidth}
      />
      <section className="main-view__minion">
        <Minion />
      </section>
    </div>
  );
}
