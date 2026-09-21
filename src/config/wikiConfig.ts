export interface WikiConfig {
    folderPath: string;
    model: string;
    schedule: number;
    includePatterns: string[];
    excludePatterns: string[];
    chunkSize: number;
    chunkOverlap: number;
}

const DEFAULT_CONFIG: WikiConfig = {
    folderPath: '',
    model: 'nomic-embed-text',
    schedule: 5,
    includePatterns: ['**/*.md'],
    excludePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    chunkSize: 500,
    chunkOverlap: 50,
};

const STORAGE_KEY = 'paperling:wikiConfig';

function validateFolderPath(path: string): boolean {
    return typeof path === 'string' && path.length > 0;
}

function validateModel(model: string): boolean {
    return typeof model === 'string' && model.length > 0;
}

function validateSchedule(schedule: number): boolean {
    return Number.isInteger(schedule) && schedule >= 0;
}

function validateChunkSize(size: number): boolean {
    return Number.isInteger(size) && size > 0 && size <= 2000;
}

function validateChunkOverlap(overlap: number, chunkSize: number): boolean {
    return Number.isInteger(overlap) && overlap >= 0 && overlap < chunkSize;
}

export function validateWikiConfig(config: Partial<WikiConfig>): { valid: boolean; error?: string } {
    if (!validateFolderPath(config.folderPath || '')) {
        return { valid: false, error: 'Wiki folder path is required' };
    }
    if (!validateModel(config.model || '')) {
        return { valid: false, error: 'Embeddings model is required' };
    }
    if (!validateSchedule(config.schedule ?? 0)) {
        return { valid: false, error: 'Schedule must be a non-negative integer' };
    }
    if (!validateChunkSize(config.chunkSize ?? 0)) {
        return { valid: false, error: 'Chunk size must be between 1 and 2000' };
    }
    if (!validateChunkOverlap(config.chunkOverlap ?? 0, config.chunkSize ?? 500)) {
        return { valid: false, error: 'Chunk overlap must be non-negative and less than chunk size' };
    }
    return { valid: true };
}

export function getWikiConfig(): WikiConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const validation = validateWikiConfig(parsed);
            if (validation.valid) {
                return { ...DEFAULT_CONFIG, ...parsed };
            }
        }
    } catch {/* storage unavailable or corrupted */}
    return { ...DEFAULT_CONFIG };
}

export function setWikiConfig(config: Partial<WikiConfig>): boolean {
    const validation = validateWikiConfig(config);
    if (!validation.valid) {
        console.error('Invalid wiki config:', validation.error);
        return false;
    }
    const current = getWikiConfig();
    const merged = { ...current, ...config };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return true;
    } catch {/* storage may be full / disabled */}
    return false;
}

export function clearWikiConfig(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {/* ignore */}
}
