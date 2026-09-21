# Session Handoff — OnePaperling Custom Theme Implementation

## Context

User (Ludwig) is building a custom theme system for OnePaperling (a Tauri-based Markdown editor fork of Paperling). The goal is to support loading custom themes from VSCode JSON format, with runtime CSS injection and theme management UI.

## Current State

- **Plan saved**: `D:\Github\OnePaperling\.kilo\plans\1787232869877-paperling-llm-wiki-theme-plan.md`
- **Themes available**: 3 Kraftwerk VSCode themes in `D:\Github\OnePaperling\themes\kraftwerk-glass-vscode\themes\`
  - `kraftwerk-glass-emerald-color-theme.json`
  - `kraftwerk-glass-ruby-color-theme.json`
  - `kraftwerk-glass-sapphire-color-theme.json`
- **Spec available**: `D:\Github\OnePaperling\specifications\MinimalSpcificationsAndPrinciles.md`
- **LLMWikis.org**: Validated — minimal MVP approach confirmed correct

## What Was Done

1. Explored codebase structure (Paperling → OnePaperling fork)
2. Analyzed current theme system (`ThemeContext.tsx`, `index.css`)
3. Analyzed VSCode theme format (colors + tokenColors)
4. Created VSCode → Paperling color mapping (19 variables)
5. Validated LLM Wiki spec against LLMWikis.org
6. Wrote implementation plan with 5 tasks

## What Needs to Be Done (Implementation)

### Task 1: `src/utils/vscodeThemeConverter.ts` (NEW)
- VSCode JSON → Paperling ThemeDefinition converter
- Color mapping (19 keys)
- Alpha stripping (`#AARRGGBB` → `#RRGGBB`)
- Auto-discover `themes/` folder

### Task 2: `src/utils/themes.ts` (NEW)
- `ThemeDefinition` interface
- Storage functions (localStorage)
- Default colors fallback

### Task 3: `src/context/ThemeContext.tsx` (MODIFY)
- Add `'custom'` to Theme type
- Add `customTheme` state
- Runtime CSS injection via `style.setProperty()`

### Task 4: `src/components/SettingsModal.tsx` (MODIFY)
- Add "Themes" tab
- Import/export/manage UI
- VSCode format detection

### Task 5: `src/main.tsx` or `src/App.tsx` (MODIFY)
- Auto-discover themes on app launch

## Key Technical Details

### Color Mapping Reference
```
editor.background → --bg-primary
sideBar.background → --bg-secondary
titleBar.activeBackground → --bg-titlebar
editor.foreground → --text-primary
descriptionForeground → --text-secondary
editorCursor.foreground → --accent
editorBracketMatch.border → --accent-hover
editorGutter.addedBackground → --status-saved
statusBar.background → --status-unsaved
input.background → --bg-input
list.hoverBackground → --bg-hover
scrollbarSlider.background → --scrollbar-thumb
scrollbarSlider.hoverBackground → --scrollbar-hover
selection.background → --selection-bg
editor.lineHighlightBackground → --bg-gutter
editorLineNumber.foreground → --text-muted
widget.border / titleBar.border → --border
inputValidation.errorBorder → --danger
```

### Storage Keys
- `paperling-custom-themes` → array of ThemeDefinition
- `paperling-theme` → "custom" when active
- `paperling-custom-theme-id` → theme id string

### Existing Files to Read First
1. `D:\Github\OnePaperling\src\context\ThemeContext.tsx` — current theme system
2. `D:\Github\OnePaperling\src\components\SettingsModal.tsx` — settings UI
3. `D:\Github\OnePaperling\src\index.css` — CSS variables (lines 5-200)
4. `D:\Github\OnePaperling\themes\kraftwerk-glass-vscode\themes\kraftwerk-glass-emerald-color-theme.json` — sample VSCode theme

## Validation Requirements
- Import Kraftwerk Emerald → all colors render
- Switch built-in ↔ custom → smooth transition
- Export → JSON round-trips
- Delete → fallback to default
- Restart → persists
- Invalid JSON → error toast, no crash

## Notes
- No changes to `src/index.css` needed (runtime injection)
- Tauri commands NOT needed for Phase 1 (localStorage only)
- LLM Wiki is Phase 2 — not implemented here
