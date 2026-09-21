# OnePaperling — Custom Theme System (Phase 1)

> **Goal**: Add custom theme support with VSCode JSON import, runtime CSS injection, and theme management UI.
> **Spec**: `specifications/MinimalSpcificationsAndPrinciles.md` (LLM Wiki — Phase 2, deferred)
> **Themes available**: 3 Kraftwerk VSCode themes in `themes/kraftwerk-glass-vscode/themes/*.json`
> **References**: LLMWikis.org validated — minimal MVP correct.

---

## Implementation Tasks

### Task 1: Create `src/utils/vscodeThemeConverter.ts`

Convert VSCode color-theme JSON to Paperling `ThemeDefinition` format.

**Input**: VSCode theme JSON with `colors` object (8-char hex with alpha like `#3ECF8ECC`)
**Output**: `ThemeDefinition { name, id, colors }`

**Color mapping** (VSCode key → Paperling CSS variable):

| VSCode Key | CSS Variable |
|---|---|
| `editor.background` | `--bg-primary` |
| `sideBar.background` | `--bg-secondary` |
| `titleBar.activeBackground` | `--bg-titlebar` |
| `editor.foreground` | `--text-primary` |
| `descriptionForeground` | `--text-secondary` |
| `editorCursor.foreground` | `--accent` |
| `editorBracketMatch.border` | `--accent-hover` |
| `editorGutter.addedBackground` | `--status-saved` |
| `statusBar.background` | `--status-unsaved` |
| `input.background` | `--bg-input` |
| `list.hoverBackground` | `--bg-hover` |
| `scrollbarSlider.background` | `--scrollbar-thumb` |
| `scrollbarSlider.hoverBackground` | `--scrollbar-hover` |
| `selection.background` | `--selection-bg` |
| `editor.lineHighlightBackground` | `--bg-gutter` |
| `editorLineNumber.foreground` | `--text-muted` |
| `widget.border` / `titleBar.border` | `--border` |
| `inputValidation.errorBorder` | `--danger` |

**Helpers needed**:
- `stripAlpha(hex: string)`: `#3ECF8ECC` → `#3ECF8E`
- `mapColors(vscodeColors: Record<string, string>): Record<string, string>`
- `extractThemeInfo(json: object): ThemeDefinition` (name from `name` field, id from filename)
- `autoDiscoverThemes(folder: string): Promise<ThemeDefinition[]>` — scan for `*-color-theme.json`

### Task 2: Create `src/utils/themes.ts`

Theme definition schema and storage utilities.

```typescript
export interface ThemeDefinition {
  name: string;       // Display name: "Kraftwerk Glass Emerald"
  id: string;         // Unique ID: "kraftwerk-emerald"
  colors: Record<string, string>;  // All CSS variables
  isCustom: true;
}

export type ThemeName = 'dark' | 'light' | 'paper' | 'dracula' | 'custom';
```

**Storage keys**:
- `paperling-custom-themes` → array of `ThemeDefinition`
- `paperling-theme` → `"custom"` when custom active
- `paperling-custom-theme-id` → theme id string

**Functions**:
- `saveCustomTheme(theme: ThemeDefinition): void`
- `loadCustomTheme(id: string): ThemeDefinition | null`
- `listCustomThemes(): ThemeDefinition[]`
- `deleteCustomTheme(id: string): void`
- `getDefaultColors(): Record<string, string>` — dark theme defaults for missing colors

### Task 3: Modify `src/context/ThemeContext.tsx`

Extend theme type and add custom theme support.

**Changes**:
1. Add `'custom'` to `Theme` type union
2. Add `customTheme: ThemeDefinition | null` to `ThemeContextType`
3. Add `setCustomTheme: (theme: ThemeDefinition | null) => void` to context
4. In the `useEffect` that applies theme:
   - If `theme === 'custom'` and `customTheme` exists: inject CSS vars via `document.documentElement.style.setProperty()`
   - Otherwise: use existing `[data-theme]` approach

**Key code**:
```typescript
useEffect(() => {
  if (theme === 'custom' && customTheme) {
    Object.entries(customTheme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  } else {
    // Reset custom theme vars to defaults
    document.documentElement.style.removeProperty('--bg-primary');
    // ... reset all vars
    document.documentElement.setAttribute('data-theme', theme === 'custom' ? 'dark' : theme);
  }
}, [theme, customTheme]);
```

### Task 4: Modify `src/components/SettingsModal.tsx`

Add "Themes" tab with import/export/manage UI.

**UI Structure**:
```
Themes Tab
├── Theme Selector (dropdown)
│   ├── dark
│   ├── light
│   ├── paper
│   ├── dracula
│   └── Custom
└── [When Custom selected]
    ├── "Import from VSCode JSON" (file picker)
    ├── "Import from Paperling JSON" (file picker)
    ├── "Export Current Theme" (download)
    ├── "Manage Themes"
    │   ├── [list of saved custom themes]
    │   │   ├── [theme name] [Select] [Delete]
    │   └── [Color swatch preview]
    └── "Auto-Discover Local Themes" (scan themes/ folder)
```

**File picker handler**:
1. Read JSON file
2. Detect VSCode format (has `colors` object) vs Paperling format (has `name`, `id`, `colors`)
3. If VSCode format → run converter → validate → save
4. If Paperling format → validate → save
5. Show success toast

### Task 5: Auto-discover themes on app launch

In `main.tsx` or `App.tsx`:
1. On app start, scan `themes/` folder for `*-color-theme.json` files
2. Convert each to `ThemeDefinition`
3. If themes found but none saved to localStorage → show "Import themes?" dialog
4. On import → save to localStorage + set as active

---

## Files Changed

| File | Action |
|---|---|
| `src/utils/vscodeThemeConverter.ts` | **New** |
| `src/utils/themes.ts` | **New** |
| `src/context/ThemeContext.tsx` | Modify (extend type, add state, runtime injection) |
| `src/components/SettingsModal.tsx` | Modify (add Themes tab) |
| `src/index.css` | No changes |
| `src/main.tsx` or `src/App.tsx` | Modify (auto-discover on launch) |

---

## Validation Checklist

- [ ] Import Kraftwerk Emerald → all UI elements use correct colors
- [ ] Switch built-in → custom → smooth transition, no flash
- [ ] Switch custom → built-in → CSS vars reset correctly
- [ ] Export current custom theme → JSON matches source
- [ ] Delete custom theme → fallback to dark theme
- [ ] App restart → custom theme persists
- [ ] Auto-discover → themes appear in import dialog
- [ ] Invalid JSON → error toast, no crash
- [ ] Missing colors → defaults applied, no broken UI

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| CSS variable name mismatch | Map all 19 variables explicitly; document the mapping |
| Alpha channel in hex | Strip to 6-char before applying |
| Theme injection conflicts | Use `style.setProperty()` not inline styles; reset on theme switch |
| Performance on theme switch | Batch property updates; use `requestAnimationFrame` if needed |
| Missing VSCode keys | Use dark theme defaults for unmapped keys |

---

## Phase 2: LLM Wiki (Deferred)

Per spec (`specifications/MinimalSpcificationsAndPrinciles.md`):
- 3 layers: Raw → Wiki → Schema
- 3 ops: Ingest, Query, Lint
- MVP: No RAG, no embeddings, just folders + Markdown
- LLMWikis.org confirms: start simple, add retrieval last

Components for Phase 2 (not implemented here):
- Wiki Settings tab, Ingest engine, Scheduler, Knowledge store (IndexedDB), Query engine, AI panel Wiki mode, Lint function
