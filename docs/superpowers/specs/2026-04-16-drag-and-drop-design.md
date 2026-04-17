# Drag & Drop — TaskFlow Board

**Date:** 2026-04-16  
**Status:** Approved

## Overview

Replace the "Move to" dropdown on task cards with full drag-and-drop using `@hello-pangea/dnd`. Cards can be dragged between columns and reordered within a column.

## Library

`@hello-pangea/dnd` — actively maintained fork of `react-beautiful-dnd`. Chosen for its purpose-built kanban API, smooth spring animations out-of-the-box, and minimal setup for the droppable-column / draggable-card pattern.

## Component Changes

### `Board.tsx`
- Wrap the board with `<DragDropContext onDragEnd={handleDragEnd}>`.
- `handleDragEnd` receives `result: DropResult` with `source` and `destination` (each has `droppableId` = column `_id` and `index`).
- If `destination` is null (dropped outside) or source equals destination, do nothing.
- Otherwise call the updated `moveToColumn` Convex mutation.

### `Column.tsx`
- Wrap the task list `<div>` with `<Droppable droppableId={column._id}>`.
- The render prop provides `droppableProps` and `placeholder` (required by the library to maintain list height during drag).
- Remove `columns` prop — no longer needed here.

### `TaskCard.tsx`
- Wrap with `<Draggable draggableId={task._id} index={task.order}>`.
- Apply `draggableProps`, `dragHandleProps`, and `ref` from the render prop.
- Remove the "Move to" `<select>` and its `handleMove` handler.
- Remove `columns` prop from the component interface.

## Convex Mutation Change

### `convex/tasks/mutations.ts` — `moveToColumn`

Add an `order` argument. The handler reorders tasks in both affected columns:

1. Fetch all tasks in the **source column** (excluding the moved task), sort by current order, re-number them 0…n sequentially.
2. Fetch all tasks in the **destination column** (excluding the moved task), sort by current order, insert the moved task at `order` by shifting tasks at `>= order` up by 1.
3. Patch the moved task with `{ columnId, order }`.

This handles both cross-column moves and within-column reordering (same columnId for source and destination).

The existing notification logic (notify assignee when moved) is preserved.

## What Is Removed

- "Move to" `<select>` in `TaskCard`
- `columns` prop passed down through `Column` → `TaskCard`
- `handleMove` function in `TaskCard`

## What Is Not Changed

- The `moveToColumn` mutation signature gains one new required arg (`order: v.number()`). No other mutations change.
- Assign dropdown stays as-is.
- Notification behavior stays as-is.

## Out of Scope

- Drag-to-create or drag-to-delete
- Column reordering
- Optimistic updates (Convex is fast enough; revisit if flicker is noticeable)
- Mobile touch drag (supported by the library but not explicitly tested)
