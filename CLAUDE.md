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
