import { Droppable } from "@hello-pangea/dnd";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  column: Doc<"columns">;
  onAddTask: (columnId: Doc<"columns">["_id"]) => void;
}

const columnIcons: Record<string, string> = {
  Backlog: "📋",
  "To Do": "📌",
  "In Progress": "🔄",
  Done: "✅",
};

export function Column({ column, onAddTask }: ColumnProps) {
  const tasks = useQuery(api.tasks.listByColumn, { columnId: column._id });
  const sortedTasks = tasks ? [...tasks].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="column" data-column={column.title}>
      <div className="column-header">
        <span className="column-icon">{columnIcons[column.title] ?? "📄"}</span>
        <h3>{column.title}</h3>
        <span className="task-count">{sortedTasks.length}</span>
      </div>

      <Droppable droppableId={column._id}>
        {(provided) => (
          <div
            className="column-tasks"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {sortedTasks.map((task, index) => (
              <TaskCard key={task._id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <button className="btn-add-task" onClick={() => onAddTask(column._id)}>
        + Add Task
      </button>
    </div>
  );
}
