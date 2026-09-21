import { getCustomThemes, saveCustomThemes, getCustomThemeById, setActiveCustomThemeId, type CustomTheme } from '../context/ThemeContext';

export interface ThemeDefinition {
    name: string;
    id: string;
    colors: {
        'bg-primary': string;
        'bg-secondary': string;
        'bg-titlebar': string;
        'bg-editor': string;
        'bg-gutter': string;
        'bg-hover': string;
        'bg-input': string;
        'text-primary': string;
        'text-secondary': string;
        'text-muted': string;
        'accent': string;
        'accent-hover': string;
        'accent-text': string;
        'border': string;
        'border-subtle': string;
        'code-bg': string;
        'code-text': string;
        'blockquote-bg': string;
        'syntax-h1': string;
        'syntax-h2': string;
        'syntax-h3': string;
        'syntax-link': string;
        'syntax-bold': string;
        'syntax-list': string;
        'syntax-number': string;
        'syntax-quote': string;
        'syntax-code': string;
        'status-saved': string;
        'status-unsaved': string;
        'danger': string;
        'scrollbar-track': string;
        'scrollbar-thumb': string;
        'scrollbar-hover': string;
        'selection-bg': string;
        'selection-text': string;
    };
}

const REQUIRED_COLOR_KEYS: (keyof ThemeDefinition['colors'])[] = [
    'bg-primary', 'bg-secondary', 'bg-titlebar', 'bg-editor', 'bg-gutter',
    'bg-hover', 'bg-input', 'text-primary', 'text-secondary', 'text-muted',
    'accent', 'accent-hover', 'accent-text', 'border', 'border-subtle',
    'code-bg', 'code-text', 'blockquote-bg', 'syntax-h1', 'syntax-h2',
    'syntax-h3', 'syntax-link', 'syntax-bold', 'syntax-list', 'syntax-number',
    'syntax-quote', 'syntax-code', 'status-saved', 'status-unsaved', 'danger',
    'scrollbar-track', 'scrollbar-thumb', 'scrollbar-hover', 'selection-bg',
    'selection-text',
];

const DARK_THEME_DEFAULTS: Record<string, string> = {
    'bg-primary': '#0a0a0a', 'bg-secondary': '#141414', 'bg-titlebar': '#0a0a0a',
    'bg-editor': '#0a0a0a', 'bg-gutter': '#0f0f0f', 'bg-hover': '#1f1f1f',
    'bg-input': '#141414', 'text-primary': '#ffffff', 'text-secondary': '#737373',
    'text-muted': '#525252', 'accent': '#ffffff', 'accent-hover': 'rgba(255, 255, 255, 0.9)',
    'accent-text': '#0a0a0a', 'border': '#262626', 'border-subtle': '#1a1a1a',
    'code-bg': '#141414', 'code-text': '#a3a3a3', 'blockquote-bg': 'rgba(20, 20, 20, 0.8)',
    'syntax-h1': '#ffffff', 'syntax-h2': '#e5e5e5', 'syntax-h3': '#d4d4d4',
    'syntax-link': '#a3a3a3', 'syntax-bold': '#ffffff', 'syntax-list': '#a3a3a3',
    'syntax-number': '#a3a3a3', 'syntax-quote': '#737373', 'syntax-code': '#737373',
    'status-saved': '#22c55e', 'status-unsaved': '#f59e0b', 'danger': '#ef4444',
    'scrollbar-track': '#0a0a0a', 'scrollbar-thumb': '#262626', 'scrollbar-hover': '#404040',
    'selection-bg': '#404040', 'selection-text': '#ffffff',
};

function isThemeDefinition(obj: unknown): obj is ThemeDefinition {
    if (typeof obj !== 'object' || obj === null) return false;
    const t = obj as Record<string, unknown>;
    if (typeof t.name !== 'string' || typeof t.id !== 'string') return false;
    if (typeof t.colors !== 'object' || t.colors === null) return false;
    const colors = t.colors as Record<string, unknown>;
    for (const key of REQUIRED_COLOR_KEYS) {
        if (typeof colors[key] !== 'string') return false;
    }
    return true;
}

function fillMissingColors(theme: Partial<ThemeDefinition>): ThemeDefinition {
    const colors: Record<string, string> = { ...DARK_THEME_DEFAULTS };
    if (theme.colors) {
        for (const key of REQUIRED_COLOR_KEYS) {
            if (typeof theme.colors[key] === 'string') {
                colors[key] = theme.colors[key];
            }
        }
    }
    return {
        name: theme.name || 'Untitled',
        id: theme.id || `custom-${Date.now()}`,
        colors: colors as ThemeDefinition['colors'],
    };
}

export function validateThemeDefinition(obj: unknown): { valid: boolean; theme?: ThemeDefinition; error?: string } {
    if (!isThemeDefinition(obj)) {
        return { valid: false, error: 'Invalid theme format. Expected { name, id, colors: { ... } }' };
    }
    return { valid: true, theme: fillMissingColors(obj) };
}

export function importThemeFromFile(file: File): Promise<{ valid: boolean; theme?: ThemeDefinition; error?: string }> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                const result = validateThemeDefinition(parsed);
                resolve(result);
            } catch {
                resolve({ valid: false, error: 'Failed to parse theme JSON' });
            }
        };
        reader.onerror = () => {
            resolve({ valid: false, error: 'Failed to read file' });
        };
        reader.readAsText(file);
    });
}

export function exportTheme(theme: ThemeDefinition): void {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.id}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function addCustomTheme(theme: ThemeDefinition): CustomTheme[] {
    const themes = getCustomThemes();
    const existingIndex = themes.findIndex(t => t.id === theme.id);
    const customTheme: CustomTheme = { name: theme.name, id: theme.id, colors: theme.colors as Record<string, string> };
    if (existingIndex >= 0) {
        themes[existingIndex] = customTheme;
    } else {
        themes.push(customTheme);
    }
    saveCustomThemes(themes);
    return themes;
}

export function removeCustomTheme(id: string): boolean {
    const themes = getCustomThemes();
    const filtered = themes.filter(t => t.id !== id);
    if (filtered.length === themes.length) return false;
    saveCustomThemes(filtered);
    if (getCustomThemeById(id) === null && localStorage.getItem('paperling-custom-theme-active') === id) {
        setActiveCustomThemeId(null);
    }
    return true;
}

export function selectCustomTheme(id: string): boolean {
    const theme = getCustomThemeById(id);
    if (!theme) return false;
    setActiveCustomThemeId(id);
    return true;
}
