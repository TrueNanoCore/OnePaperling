import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ensureFontLoaded } from '../fonts';

export type Theme = 'dark' | 'light' | 'paper' | 'dracula' | 'custom';
export type FontFamily = 'inter' | 'merriweather' | 'lora' | 'source-serif' | 'fira-sans';
export type FontSize = 'small' | 'medium' | 'large';

export interface CustomTheme {
    name: string;
    id: string;
    colors: Record<string, string>;
}

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    customThemeName: string | null;
    setCustomThemeName: (name: string | null) => void;
    font: FontFamily;
    setFont: (font: FontFamily) => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'paperling-theme';
const CUSTOM_THEME_STORAGE_KEY = 'paperling-custom-theme-active';
const CUSTOM_THEMES_STORAGE_KEY = 'paperling-custom-themes';
const FONT_STORAGE_KEY = 'paperling-font';
const FONT_SIZE_STORAGE_KEY = 'paperling-font-size';

// Valid values for validation against corrupted localStorage
const VALID_THEMES: Theme[] = ['dark', 'light', 'paper', 'dracula', 'custom'];
const VALID_FONTS: FontFamily[] = ['inter', 'merriweather', 'lora', 'source-serif', 'fira-sans'];
const VALID_FONT_SIZES: FontSize[] = ['small', 'medium', 'large'];

function getValidated<T extends string>(key: string, validValues: T[], fallback: T): T {
    const stored = localStorage.getItem(key);
    if (stored && validValues.includes(stored as T)) {
        return stored as T;
    }
    return fallback;
}

export function getCustomThemes(): CustomTheme[] {
    try {
        const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((t: unknown): t is CustomTheme => typeof t === 'object' && t !== null && typeof (t as Record<string, unknown>).name === 'string' && typeof (t as Record<string, unknown>).id === 'string' && typeof (t as Record<string, unknown>).colors === 'object' && (t as Record<string, unknown>).colors !== null);
    } catch {
        return [];
    }
}

export function saveCustomThemes(themes: CustomTheme[]): void {
    try {
        localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
    } catch {/* storage may be full / disabled */}
}

export function getActiveCustomThemeId(): string | null {
    return localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
}

export function setActiveCustomThemeId(id: string | null): void {
    try {
        if (id === null) {
            localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
        } else {
            localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, id);
        }
    } catch {/* storage may be full / disabled */}
}

export function getCustomThemeById(id: string): CustomTheme | null {
    const themes = getCustomThemes();
    return themes.find(t => t.id === id) || null;
}

/** True when the OS reports a light color scheme. Guarded for non-browser
 *  contexts (SSR/tests) where matchMedia is absent. */
function prefersLight(): boolean {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-color-scheme: light)').matches;
}

/** Theme to start with: a previously saved choice wins; otherwise match the OS
 *  so a first launch doesn't blast a dark UI at someone on a light desktop (or
 *  vice versa). Falls back to dark when the preference can't be read. */
function getInitialTheme(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored as Theme)) {
        return stored as Theme;
    }
    return prefersLight() ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);
    const [customThemeName, setCustomThemeNameState] = useState<string | null>(() => {
        if (theme !== 'custom') return null;
        return getActiveCustomThemeId();
    });

    const [font, setFontState] = useState<FontFamily>(() =>
        getValidated(FONT_STORAGE_KEY, VALID_FONTS, 'inter')
    );

    const [fontSize, setFontSizeState] = useState<FontSize>(() =>
        getValidated(FONT_SIZE_STORAGE_KEY, VALID_FONT_SIZES, 'medium')
    );

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        if (newTheme !== 'custom') {
            setCustomThemeNameState(null);
        }
    };

    const setCustomThemeName = (name: string | null) => {
        setCustomThemeNameState(name);
        setActiveCustomThemeId(name);
        if (name) {
            setThemeState('custom');
            localStorage.setItem(THEME_STORAGE_KEY, 'custom');
        }
    };

    const setFont = (newFont: FontFamily) => {
        setFontState(newFont);
        localStorage.setItem(FONT_STORAGE_KEY, newFont);
    };

    const setFontSize = (newSize: FontSize) => {
        setFontSizeState(newSize);
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, newSize);
    };

    // Apply theme, font, and font size to document in a single effect. Also
    // lazy-load the chosen body font's CSS (no-op for the eager Inter default).
    // Runs on mount too, so a persisted non-default font is fetched on launch.
    useEffect(() => {
        ensureFontLoaded(font);
        const el = document.documentElement;
        el.setAttribute('data-theme', theme);
        el.setAttribute('data-font', font);
        el.setAttribute('data-font-size', fontSize);

        // Clear any previously injected custom theme variables
        const styleEl = el.querySelector('#paperling-custom-theme-styles');
        if (styleEl) styleEl.remove();

        // Inject custom theme CSS variables if active
        if (theme === 'custom' && customThemeName) {
            const customTheme = getCustomThemeById(customThemeName);
            if (customTheme && customTheme.colors) {
                const style = document.createElement('style');
                style.id = 'paperling-custom-theme-styles';
                const vars = Object.entries(customTheme.colors)
                    .map(([key, value]) => `  --${key}: ${value};`)
                    .join('\n');
                style.textContent = `:root {${vars}\n}`;
                document.head.appendChild(style);
            }
        }
    }, [theme, font, fontSize, customThemeName]);

    // Track the OS theme until the user picks one explicitly. The handler
    // re-checks storage each time so flipping the OS appearance never overrides
    // a deliberate choice the user made earlier in the session.
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const onChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                setThemeState(e.matches ? 'light' : 'dark');
            }
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, customThemeName, setCustomThemeName, font, setFont, fontSize, setFontSize }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
