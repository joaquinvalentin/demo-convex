import { Draggable } from "@hello-pangea/dnd";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface TaskCardProps {
  task: Doc<"tasks">;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  const users = useQuery(api.auth.listUsers);
  const assign = useMutation(api.tasks.assign);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const assignee = users?.find((u) => u._id === task.assigneeId);
  const creator = users?.find((u) => u._id === task.createdBy);

  const handleAssign = async (assigneeId: string) => {
    await assign({
      taskId: task._id,
      assigneeId: assigneeId ? (assigneeId as Id<"users">) : undefined,
    });
  };

  const handleDelete = async () => {
    if (confirm("Delete this task?")) {
      await deleteTask({ taskId: task._id });
    }
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <div
          className="task-card"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="task-header">
            <span className={`priority-badge priority-${task.priority}`}>
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
      )}
    </Draggable>
  );
}
