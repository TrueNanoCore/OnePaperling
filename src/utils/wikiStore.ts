/**
 * IndexedDB knowledge store for LLM Wiki chunks.
 * 
 * Schema:
 * - Store name: 'chunks'
 * - Key: chunk ID (auto-generated)
 * - Fields: fileId, fileName, filePath, heading, content, tokens, indexedAt
 * 
 * Indexes:
 * - filePath: for querying by file
 * - indexedAt: for cleanup of old chunks
 */

const DB_NAME = 'PaperlingWiki';
const DB_VERSION = 1;
const STORE_NAME = 'chunks';

interface Chunk {
    id: string;
    fileId: string;
    fileName: string;
    filePath: string;
    heading: string;
    content: string;
    tokens: number;
    indexedAt: number;
}

interface ChunkStats {
    totalChunks: number;
    totalFiles: number;
    totalTokens: number;
    lastIndexed: number | null;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('filePath', 'filePath', { unique: false });
                store.createIndex('indexedAt', 'indexedAt', { unique: false });
            }
        };
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(new Error('Failed to open wiki database'));
        };
    });
}

export async function addChunk(chunk: Omit<Chunk, 'id' | 'indexedAt'>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const fullChunk: Chunk = {
            ...chunk,
            id: `${chunk.filePath}:${chunk.heading}:${chunk.content.substring(0, 50)}`,
            indexedAt: Date.now(),
        };
        
        const request = store.add(fullChunk);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to add chunk'));
        
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(new Error('Transaction failed'));
    });
}

export async function addChunks(chunks: Omit<Chunk, 'id' | 'indexedAt'>[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        for (const chunk of chunks) {
            const fullChunk: Chunk = {
                ...chunk,
                id: `${chunk.filePath}:${chunk.heading}:${chunk.content.substring(0, 50)}`,
                indexedAt: Date.now(),
            };
            store.add(fullChunk);
        }
        
        transaction.oncomplete = () => {
            db.close();
            resolve();
        };
        transaction.onerror = () => {
            db.close();
            reject(new Error('Transaction failed'));
        };
    });
}

export async function deleteChunksByFile(filePath: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('filePath');
        const request = index.getAll(filePath);
        
        request.onsuccess = () => {
            const chunks = request.result as Chunk[];
            for (const chunk of chunks) {
                store.delete(chunk.id);
            }
            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
        };
        
        request.onerror = () => {
            db.close();
            reject(new Error('Failed to delete chunks'));
        };
    });
}

export async function searchChunks(query: string, limit: number = 10): Promise<Chunk[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const allChunks = request.result as Chunk[];
            const queryLower = query.toLowerCase();
            const words = queryLower.split(/\s+/).filter(w => w.length > 0);
            
            const scored = allChunks.map(chunk => {
                let score = 0;
                const contentLower = chunk.content.toLowerCase();
                const headingLower = chunk.heading.toLowerCase();
                
                for (const word of words) {
                    if (headingLower.includes(word)) score += 10;
                    if (contentLower.includes(word)) score += 5;
                    if (chunk.fileName.toLowerCase().includes(word)) score += 3;
                }
                
                return { chunk, score };
            });
            
            scored.sort((a, b) => b.score - a.score);
            const results = scored.slice(0, limit).map(s => s.chunk);
            
            db.close();
            resolve(results);
        };
        
        request.onerror = () => {
            db.close();
            reject(new Error('Failed to search chunks'));
        };
    });
}

export async function getStats(): Promise<ChunkStats> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();
        const allRequest = store.getAll();
        
        let lastIndexed: number | null = null;
        
        countRequest.onsuccess = () => {
            const totalChunks = countRequest.result;
            
            allRequest.onsuccess = () => {
                const chunks = allRequest.result as Chunk[];
                const files = new Set(chunks.map(c => c.filePath));
                
                for (const chunk of chunks) {
                    if (!lastIndexed || chunk.indexedAt > lastIndexed) {
                        lastIndexed = chunk.indexedAt;
                    }
                }
                
                const totalTokens = chunks.reduce((sum, c) => sum + c.tokens, 0);
                
                db.close();
                resolve({
                    totalChunks,
                    totalFiles: files.size,
                    totalTokens,
                    lastIndexed,
                });
            };
            
            allRequest.onerror = () => {
                db.close();
                reject(new Error('Failed to get stats'));
            };
        };
        
        countRequest.onerror = () => {
            db.close();
            reject(new Error('Failed to get stats'));
        };
    });
}

export async function clearAllChunks(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onsuccess = () => {
            db.close();
            resolve();
        };
        
        request.onerror = () => {
            db.close();
            reject(new Error('Failed to clear chunks'));
        };
    });
}
