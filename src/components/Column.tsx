import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  column: Doc<"columns">;
  columns: Doc<"columns">[];
  onAddTask: (columnId: Doc<"columns">["_id"]) => void;
}

const columnIcons: Record<string, string> = {
  Backlog: "📋",
  "To Do": "📌",
  "In Progress": "🔄",
  Done: "✅",
};

export function Column({ column, columns, onAddTask }: ColumnProps) {
  const tasks = useQuery(api.tasks.listByColumn, { columnId: column._id });

  return (
    <div className="column">
      <div className="column-header">
        <span className="column-icon">{columnIcons[column.title] ?? "📄"}</span>
        <h3>{column.title}</h3>
        <span className="task-count">{tasks?.length ?? 0}</span>
      </div>

      <div className="column-tasks">
        {tasks
          ?.sort((a, b) => a.order - b.order)
          .map((task) => (
            <TaskCard key={task._id} task={task} columns={columns} />
          ))}
      </div>

      <button className="btn-add-task" onClick={() => onAddTask(column._id)}>
        + Add Task
      </button>
    </div>
  );
}
