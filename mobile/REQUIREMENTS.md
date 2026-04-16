# Requirements

## App.js

1. [DONE] Navigation: Multi-screen setup using React Navigation.
2. [DONE] RULE: Do not compress requirements.
3. [DONE] FIX: Replace accidental web 'div' with React Native 'View'.
4. [DONE] Global: Adhere to device light/dark theme via useColorScheme.

## HomeScreen.js

1.  [DONE] Create a basic Todo List App structure.
2.  [DONE] Display nested JSON tasks (Unlimited Nesting).
3.  [DONE] Inline input for main list and sub-lists.
4.  [DONE] Persistence using AsyncStorage.
5.  [DONE] Expand/Collapse logic with auto-expand on add.
6.  [DONE] Force all items to COLLAPSED state on App Load.
7.  [DONE] FIX: Aggressive keyboard handling to prevent double-taps.
8.  [DONE] Single Selection Focus: Tap to select a task and highlight it.
9.  [DONE] Contextual Bottom Menu: Move 'Delete' here and add 'Focus'.
10. [DONE] UX: Automatically dismiss keyboard when an item is selected.
11. [DONE] Focus Mode: Ability to set a selected item as the visual root.
12. [DONE] Focus Navigation: 'Back' button to retreat one level up the hierarchy.
13. [DONE] UI: Persistent Bottom Menu with disabled states.
14. [DONE] UI: Breadcrumb path (non-clickable) on top-right when focused.
15. [DONE] UX: Auto-cleanup empty sub-task inputs on focus change/blur.
16. [DONE] UI: Remove global "Add to..." footer when in Focus Mode.
17. [DONE] UI: Remove vertical nesting lines.
18. [DONE] UI: Hide '+' on Focused Root; use indented permanent bottom input instead.
19. [DONE] UI: Change root header title to "Nested Focus".
20. [DONE] UI: Unclickable note icon in main list if task has content/notes.
21. [DONE] UI: Remove '○' bullet icon for singular items (no sub-tasks).
22. [DONE] Multi-Tab UI: 3 tabs at the top (Todo, Shared, Template).
23. [DONE] State Isolation: Switching tabs saves current and loads the new JSON.
24. [DONE] Clipboard: Copy/Paste tasks across different JSON tabs.
25. [DONE] Shared Linking: Tasks copied from Shared become links with a reference counter.
26. [DONE] Live Linking: Linked items render sub-tasks from the original source.
27. [DONE] Link Expansion: Linked items show arrows if source has sub-tasks.
28. [DONE] Global Data Sync: Load all 3 JSONs into memory so links work across tabs.
29. [DONE] Broken Link Warning: Show ⚠️ if the original source task is deleted.
30. [DONE] FIX: Delete logic updated for Global State compatibility.
31. [DONE] FIX: Paste logic now prioritizes selectedItem over focusRoot.

## DetailScreen.js

1. [DONE] Detail View: "Open" button to enter a dedicated task page.
2. [DONE] Feature: "Notes" text area in Detail View.
3. [DONE] Persistence: Save notes back to the main task list.
