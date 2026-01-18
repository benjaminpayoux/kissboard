# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server at localhost:3000
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Architecture

Kissboard is a local-first kanban task management app built with Next.js 16 (App Router) and IndexedDB via Dexie.

### Data Layer

All data is stored locally in IndexedDB using Dexie:
- **Schema**: `src/lib/db/schema.ts` - Database definition with projects, tasks, and images tables
- **Hooks**: `src/lib/db/hooks.ts` - React hooks using `useLiveQuery` for reactive data binding
- **Types**: `src/lib/types.ts` - TypeScript interfaces for Project, Task, TaskImage

### Key Patterns

- **Client-only components**: Most components use `"use client"` as they interact with IndexedDB
- **Live queries**: Data fetching uses `useLiveQuery` from dexie-react-hooks for automatic re-rendering
- **Drag and drop**: Task reordering uses @dnd-kit with position management in `moveTask`

### Routes

- `/` - Landing page
- `/projects` - Project list
- `/project/[id]` - Kanban board for a specific project

### Component Structure

- `src/components/board/` - Board and Column components with drag-drop logic
- `src/components/tasks/` - TaskCard and TaskModal for task display/editing
- `src/components/projects/` - Project list and creation
- `src/components/ui/` - Shared UI primitives (Button, Modal)

### Path Alias

Use `@/*` to import from `src/*` (configured in tsconfig.json).

### Optimistic Updates

Optimistic updates provide instant UI feedback before database operations complete. Instead of waiting for IndexedDB writes, the UI updates immediately using local state, then reconciles with the actual data once the write completes.

#### Implementation Pattern

The pattern uses two layers of state:
1. **Database state** (`dbTasks`/`projects`): Real data from `useLiveQuery`, automatically updated when IndexedDB changes
2. **Optimistic state** (`optimisticTasks`/`optimisticProjects`): Temporary local state showing the expected result

The displayed data is: `optimisticState ?? dbState`

#### Flow in Board.tsx (Task Drag & Drop)

1. **Drag starts**: Copy `dbTasks` into `optimisticTasks`
2. **Drag over**: Update `optimisticTasks` to show task in new position (instant visual feedback)
3. **Drag ends**:
   - Store expected final position in `pendingMove` state
   - Call `moveTask()` to persist to IndexedDB
4. **Reconciliation**: A `useEffect` watches `dbTasks` and `pendingMove`. When the database reflects the expected position, it clears both `pendingMove` and `optimisticTasks`, letting the real data take over

#### Why `queueMicrotask`

React's strict linting rules forbid calling `setState` synchronously inside `useEffect` to prevent cascading renders. Using `queueMicrotask(() => setState(...))` defers the state update to the next microtask, breaking the synchronous chain while still executing before the next paint.

This is necessary when:
- An effect needs to clear state after detecting external data changed (IndexedDB via `useLiveQuery`)
- The setState would otherwise trigger an immediate re-render within the same effect cycle

#### Files Using This Pattern

- `src/components/board/Board.tsx`: Task reordering with `pendingMove` tracking
- `src/components/projects/ProjectList.tsx`: Project reordering
