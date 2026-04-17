import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../context/AuthContext";
import { Column } from "./Column";
import { CreateTaskModal } from "./CreateTaskModal";
import { NotificationPanel } from "./NotificationPanel";

export function Board() {
  const { displayName, logout } = useAuth();
  const columns = useQuery(api.columns.list);
  const unreadCount = useQuery(api.notifications.unreadCount);
  const seedData = useMutation(api.seed.seedData);
  const moveToColumn = useMutation(api.tasks.moveToColumn).withOptimisticUpdate(
    (localStore, { taskId, columnId: destColumnId, order: destOrder }) => {
      const allColumns = localStore.getQuery(api.columns.list, {});
      if (!allColumns) return;

      let sourceColumnId: Id<"columns"> | undefined;
      let movedTask: Doc<"tasks"> | undefined;
      for (const col of allColumns) {
        const tasks = localStore.getQuery(api.tasks.listByColumn, { columnId: col._id });
        const found = tasks?.find((t) => t._id === taskId);
        if (found) { sourceColumnId = col._id; movedTask = found; break; }
      }
      if (!sourceColumnId || !movedTask) return;

      if (sourceColumnId === destColumnId) {
        const tasks = localStore.getQuery(api.tasks.listByColumn, { columnId: destColumnId });
        if (!tasks) return;
        const others = tasks.filter((t) => t._id !== taskId).sort((a, b) => a.order - b.order);
        others.splice(destOrder, 0, movedTask);
        localStore.setQuery(api.tasks.listByColumn, { columnId: destColumnId }, others.map((t, i) => ({ ...t, order: i })));
      } else {
        const sourceTasks = localStore.getQuery(api.tasks.listByColumn, { columnId: sourceColumnId });
        if (sourceTasks) {
          localStore.setQuery(api.tasks.listByColumn, { columnId: sourceColumnId },
            sourceTasks.filter((t) => t._id !== taskId).sort((a, b) => a.order - b.order).map((t, i) => ({ ...t, order: i }))
          );
        }
        const destTasks = localStore.getQuery(api.tasks.listByColumn, { columnId: destColumnId });
        if (destTasks) {
          const others = destTasks.filter((t) => t._id !== taskId).sort((a, b) => a.order - b.order);
          others.splice(destOrder, 0, { ...movedTask, columnId: destColumnId, order: destOrder });
          localStore.setQuery(api.tasks.listByColumn, { columnId: destColumnId }, others.map((t, i) => ({ ...t, order: i })));
        }
      }
    }
  );

  const [createModalColumn, setCreateModalColumn] = useState<Id<"columns"> | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    seedData();
  }, [seedData]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    try {
      await moveToColumn({
        taskId: draggableId as Id<"tasks">,
        columnId: destination.droppableId as Id<"columns">,
        order: destination.index,
      });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board-container">
        <header className="board-header">
          <div className="header-left">
            <h1>TaskFlow</h1>
            <span className="header-subtitle">Real-time Board</span>
          </div>
          <div className="header-right">
            <button
              className="btn-notification"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {(unreadCount ?? 0) > 0 && (
                <span className="badge">{unreadCount}</span>
              )}
            </button>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <button className="btn-secondary btn-sm" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}

        <div className="board">
          {columns?.map((col) => (
            <Column
              key={col._id}
              column={col}
              onAddTask={(columnId) => setCreateModalColumn(columnId)}
            />
          ))}
        </div>

        {createModalColumn && (
          <CreateTaskModal
            columnId={createModalColumn}
            onClose={() => setCreateModalColumn(null)}
          />
        )}
      </div>
    </DragDropContext>
  );
}
