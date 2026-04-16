# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Nested Focus** — a task management app built around deeply nested task trees and a "focus mode" that lets users zoom into any subtask as a temporary root view.

The repo contains two standalone sub-projects:

| Sub-project | Stack | Dir |
|---|---|---|
| Mobile (light) | React Native / Expo | `mobile/` |
| Web (full) | React + Vite | `web/` |

---

## mobile/

### Commands

```bash
cd mobile

# Start dev server (Expo Go)
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios

# EAS builds
eas build --profile development
eas build --profile preview
eas build --profile production

# Push OTA update
eas update --channel production
```

### Architecture

Two screens wired in `App.js` via React Navigation native stack:

- **`screens/HomeScreen.js`** — all core logic (~520 lines)
- **`screens/DetailScreen.js`** — notes editor for a selected task

Persistence: `@react-native-async-storage/async-storage`  
Storage keys: `@todo_v1`, `@shared_v1`, `@template_v1`, `@settings_v1`

---

## web/

### Commands

```bash
cd web
npm install
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # Production build → web/dist/
npm run preview  # Preview production build
```

### Architecture

Single-page app, no router. Two views:

- **`src/pages/HomePage.jsx`** — all core logic, mirrors HomeScreen.js
- **`src/pages/DetailPanel.jsx`** — slide-in panel, mirrors DetailScreen.js
- **`src/components/SettingsDrawer.jsx`** — slide-in settings sidebar

Persistence: `localStorage` (same keys as mobile)  
Styling: CSS Modules (`*.module.css`) + global CSS variables in `src/index.css`

---

## Shared Data Model

Tasks are plain JS objects stored as nested JSON. Each task:

```js
{
  id: number,         // Date.now() + Math.random()
  text: string,
  subTasks: Task[],   // unlimited nesting
  isExpanded: bool,   // UI state (always reset to false on load)
  showInput: bool,    // UI state for inline sub-input
  note: string,
  completed: bool,
  reappearAfter: number,  // ms; 0 = never
  completedAt: number | null,
  // Link-only fields:
  isLink: bool,
  originalId: number,
  refCount: number,
}
```

### Three-Tab Global State

Three independent task lists: `todo`, `shared`, `template`. Linked tasks (portals) resolve their source via `findTaskGlobally()`. When any tab changes, it is persisted atomically.

### Focus Mode / Focus Stack

`focusStack` is an array of task IDs. Pushing zooms into that task; popping retreats. `displayData` is either the full `taskList` or `[focusedTask]`.

### Shared Tab Linking (Portal System)

Copying from `Shared` and pasting elsewhere creates a **link** (not a copy). The link stores `originalId`. At render time, `effectiveSubTasks` are resolved from the source. Broken sources render with `⚠️ (Broken Source)`. Source tasks track `refCount`.

### Delete Behavior

Deletes remove the target ID from **all three tabs** simultaneously.
