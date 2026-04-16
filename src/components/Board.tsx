import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../context/AuthContext";
import { Column } from "./Column";
import { CreateTaskModal } from "./CreateTaskModal";
import { NotificationPanel } from "./NotificationPanel";

export function Board() {
  const { userId, displayName, logout } = useAuth();
  const columns = useQuery(api.columns.list);
  const unreadCount = useQuery(
    api.notifications.unreadCount,
    userId ? { userId } : "skip"
  );
  const seedData = useMutation(api.seed.seedData);

  const [createModalColumn, setCreateModalColumn] = useState<Id<"columns"> | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Seed data on first load
  useEffect(() => {
    seedData();
  }, [seedData]);

  return (
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
            columns={columns}
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
  );
}
