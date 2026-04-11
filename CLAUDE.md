# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Nested Focus** — a React Native / Expo mobile todo app built around deeply nested task trees and a "focus mode" that lets users zoom into any subtask as a temporary root view.

## Commands

```bash
# Start dev server (Expo Go)
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# EAS builds (requires Expo account)
eas build --profile development
eas build --profile preview
eas build --profile production

# Push OTA update
eas update --channel production
```

There is no linter or test suite configured.

## Architecture

The app has two screens wired up in `App.js` via React Navigation native stack:

- **`screens/HomeScreen.js`** — all core logic lives here (~520 lines)
- **`screens/DetailScreen.js`** — simple notes editor for a selected task

### Data Model

Tasks are plain JS objects stored as nested JSON in `AsyncStorage`. Each task has:

```js
{
  id: number,         // Date.now() + Math.random()
  text: string,
  subTasks: Task[],   // unlimited nesting
  isExpanded: bool,   // UI state (always reset to false on load)
  showInput: bool,    // UI state for inline sub-input
  note: string,
  // Link-only fields:
  isLink: bool,
  originalId: number, // points to source task in Shared tab
  refCount: number,   // how many links reference this task
}
```

### Three-Tab Global State

There are three independent task lists: `todo`, `shared`, `template`. All three are loaded into a single `globalData` state object on startup. This is critical because **linked tasks (portals)** must resolve their source across tabs — `findTaskGlobally()` searches all three lists. When any tab's data changes, `updateGlobalData(tabId, newList)` updates the in-memory state and persists to `AsyncStorage` atomically.

AsyncStorage keys: `@todo_v1`, `@shared_v1`, `@template_v1`.

### Focus Mode / Focus Stack

`focusStack` is an array of task IDs. Pushing an ID zooms the view into that task; popping retreats one level. `currentFocusId = focusStack[focusStack.length - 1]`. The `displayData` fed to the `FlatList` is either the full `taskList` or `[focusedTask]`.

### Shared Tab Linking (Portal System)

Copying a task from the `Shared` tab and pasting it elsewhere creates a **link** (not a copy). The link stores `originalId` referencing the source. At render time, `renderTaskItem` resolves the source via `findTaskGlobally(item.originalId)` and uses the source's `subTasks` as `effectiveSubTasks`. If the source is deleted, the link renders with `⚠️ (Broken Source)`. The source task tracks how many links reference it via `refCount`.

### Delete Behavior

`handleDeleteTask` removes the target ID from **all three tabs** simultaneously (not just the active one). This ensures that if a Shared source task is deleted, the deletion is consistent across the global state.

### Rendering

`renderTaskItem` is a recursive function (not a component) called directly from `FlatList.renderItem`. It recurses into `subTasks` by calling itself. This means the entire tree renders in a single `FlatList` with manually nested `View`s — there is no virtualization below the top level.
