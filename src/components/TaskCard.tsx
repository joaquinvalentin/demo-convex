import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../context/AuthContext";

const priorityColors: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

interface TaskCardProps {
  task: Doc<"tasks">;
  columns: Doc<"columns">[];
}

export function TaskCard({ task, columns }: TaskCardProps) {
  const { userId } = useAuth();
  const users = useQuery(api.auth.listUsers);
  const moveToColumn = useMutation(api.tasks.moveToColumn);
  const assign = useMutation(api.tasks.assign);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const assignee = users?.find((u) => u._id === task.assigneeId);
  const creator = users?.find((u) => u._id === task.createdBy);

  const handleMove = async (columnId: Id<"columns">) => {
    if (!userId) return;
    await moveToColumn({ taskId: task._id, columnId, movedBy: userId });
  };

  const handleAssign = async (assigneeId: string) => {
    if (!userId) return;
    await assign({
      taskId: task._id,
      assigneeId: assigneeId ? (assigneeId as Id<"users">) : undefined,
      assignedBy: userId,
    });
  };

  const handleDelete = async () => {
    if (confirm("Delete this task?")) {
      await deleteTask({ taskId: task._id });
    }
  };

  return (
    <div className="task-card" draggable>
      <div className="task-header">
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColors[task.priority] }}
        >
          {task.priority}
        </span>
        <button className="btn-icon delete-btn" onClick={handleDelete} title="Delete">
          ✕
        </button>
      </div>

      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-actions">
        <div className="action-row">
          <label>Move to:</label>
          <select
            value={task.columnId}
            onChange={(e) => handleMove(e.target.value as Id<"columns">)}
          >
            {columns.map((col) => (
              <option key={col._id} value={col._id}>
                {col.title}
              </option>
            ))}
          </select>
        </div>

        <div className="action-row">
          <label>Assign:</label>
          <select
            value={task.assigneeId ?? ""}
            onChange={(e) => handleAssign(e.target.value)}
          >
            <option value="">Unassigned</option>
            {users?.map((u) => (
              <option key={u._id} value={u._id}>
                {u.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="task-footer">
        {assignee && (
          <span
            className="avatar"
            style={{ backgroundColor: assignee.avatarColor }}
            title={assignee.displayName}
          >
            {assignee.displayName[0]}
          </span>
        )}
        <span className="created-by">by {creator?.displayName ?? "..."}</span>
      </div>
    </div>
  );
}
