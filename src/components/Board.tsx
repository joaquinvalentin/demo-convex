import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../context/AuthContext";
import { Column } from "./Column";
import { CreateTaskModal } from "./CreateTaskModal";
import { NotificationPanel } from "./NotificationPanel";

export function Board() {
  const { displayName, logout } = useAuth();
  const columns = useQuery(api.columns.list);
  const unreadCount = useQuery(api.notifications.unreadCount);
  const seedData = useMutation(api.seed.seedData);
  const moveToColumn = useMutation(api.tasks.moveToColumn);

  const [createModalColumn, setCreateModalColumn] = useState<Id<"columns"> | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    seedData();
  }, [seedData]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    await moveToColumn({
      taskId: draggableId as Id<"tasks">,
      columnId: destination.droppableId as Id<"columns">,
      order: destination.index,
    });
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
