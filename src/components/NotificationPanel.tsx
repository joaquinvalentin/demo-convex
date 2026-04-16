import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { userId } = useAuth();
  const notifications = useQuery(
    api.notifications.listForUser,
    userId ? { userId } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllAsRead({ userId });
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        <div className="notification-actions">
          <button className="btn-text" onClick={handleMarkAllRead}>
            Mark all read
          </button>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="notification-list">
        {!notifications || notifications.length === 0 ? (
          <div className="notification-empty">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`notification-item ${n.read ? "read" : "unread"}`}
              onClick={() => !n.read && markAsRead({ notificationId: n._id })}
            >
              <div className="notification-dot" />
              <div className="notification-content">
                <p>{n.message}</p>
                <span className="notification-time">
                  {formatTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
