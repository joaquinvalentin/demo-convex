# Drag & Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Move to" dropdown with drag-and-drop using `@hello-pangea/dnd`, supporting both cross-column moves and within-column reordering.

**Architecture:** `DragDropContext` wraps the board in `Board.tsx`; each `Column.tsx` is a `Droppable`; each `TaskCard.tsx` is a `Draggable`. On drop, `Board.tsx` calls the updated `moveToColumn` Convex mutation with the target column and index.

**Tech Stack:** React 19, `@hello-pangea/dnd`, Convex mutations

---

## Task 1: Install `@hello-pangea/dnd`

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `pnpm-lock.yaml` (auto)

- [ ] **Step 1: Install the package**

```bash
cd /Users/joaquin/conductor/workspaces/demo-convex/montreal
pnpm add @hello-pangea/dnd
```

Expected output: `dependencies: + @hello-pangea/dnd`  
The package ships its own TypeScript types — no `@types/*` needed.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install @hello-pangea/dnd for drag-and-drop"
```

---

## Task 2: Update `moveToColumn` mutation to accept `order` and reorder tasks

**Files:**
- Modify: `convex/tasks/mutations.ts`

- [ ] **Step 1: Replace the `moveToColumn` mutation**

In `convex/tasks/mutations.ts`, replace the entire `moveToColumn` export with:

```ts
export const moveToColumn = mutation({
  args: {
    taskId: v.id("tasks"),
    columnId: v.id("columns"),
    order: v.number(),
  },
  handler: async (ctx, { taskId, columnId, order }) => {
    const mover = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    // Re-number source column without the moved task
    const sourceTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", task.columnId))
      .collect();
    const sourceRemaining = sourceTasks
      .filter((t) => t._id !== taskId)
      .sort((a, b) => a.order - b.order);
    for (let i = 0; i < sourceRemaining.length; i++) {
      if (sourceRemaining[i].order !== i) {
        await ctx.db.patch(sourceRemaining[i]._id, { order: i });
      }
    }

    // Re-number destination column, making room at `order`
    const destTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", columnId))
      .collect();
    const destRemaining = destTasks
      .filter((t) => t._id !== taskId)
      .sort((a, b) => a.order - b.order);
    for (let i = 0; i < destRemaining.length; i++) {
      const newOrder = i >= order ? i + 1 : i;
      if (destRemaining[i].order !== newOrder) {
        await ctx.db.patch(destRemaining[i]._id, { order: newOrder });
      }
    }

    // Move the task
    await ctx.db.patch(taskId, { columnId, order });

    // Notify assignee only on cross-column moves
    if (task.assigneeId && task.assigneeId !== mover._id && task.columnId !== columnId) {
      const column = await ctx.db.get(columnId);
      await ctx.db.insert("notifications", {
        userId: task.assigneeId,
        message: `${mover.displayName} moved "${task.title}" to ${column?.title ?? "another column"}`,
        taskId,
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/tasks/mutations.ts
git commit -m "feat: update moveToColumn to accept order and reorder tasks"
```

---

## Task 3: Update `TaskCard.tsx` — add `Draggable`, remove "Move to"

**Files:**
- Modify: `src/components/TaskCard.tsx`

- [ ] **Step 1: Rewrite `TaskCard.tsx`**

Replace the entire file contents with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TaskCard.tsx
git commit -m "feat: add Draggable to TaskCard, remove Move To dropdown"
```

---

## Task 4: Update `Column.tsx` — add `Droppable`, remove `columns` prop

**Files:**
- Modify: `src/components/Column.tsx`

- [ ] **Step 1: Rewrite `Column.tsx`**

Replace the entire file contents with:

```tsx
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
  const sortedTasks = tasks?.sort((a, b) => a.order - b.order) ?? [];

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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Column.tsx
git commit -m "feat: add Droppable to Column, remove columns prop"
```

---

## Task 5: Update `Board.tsx` — add `DragDropContext` and `handleDragEnd`

**Files:**
- Modify: `src/components/Board.tsx`

- [ ] **Step 1: Rewrite `Board.tsx`**

Replace the entire file contents with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat: wrap board with DragDropContext, implement handleDragEnd"
```

---

## Task 6: Verify the implementation

- [ ] **Step 1: Run the dev server and verify**

```bash
cd /Users/joaquin/conductor/workspaces/demo-convex/montreal
pnpm dev
```

Open the app and verify:
1. Cards show a grab cursor on hover
2. Dragging a card between columns works — card appears in the new column
3. Dragging a card within the same column reorders it
4. Dropping outside any column returns the card to its original position
5. The "Move to" dropdown is gone from all cards
6. Notifications are still created when moving a card with an assignee to a different column

- [ ] **Step 2: Check TypeScript**

```bash
pnpm build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Final commit if any CSS tweaks were needed**

```bash
git add -p
git commit -m "fix: drag-and-drop visual tweaks"
```
