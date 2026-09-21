/**
 * LLM Wiki scheduler for periodic file ingestion.
 * 
 * Uses polling-based approach: checks file system at configurable intervals
 * to detect new/changed files and trigger re-indexing.
 */

import { getWikiConfig } from '../config/wikiConfig';
import { chunkMarkdown } from './wikiIngest';
import { addChunks, deleteChunksByFile, getStats } from './wikiStore';

interface FileState {
    path: string;
    mtime: number;
}

class WikiScheduler {
    private intervalId: number | null = null;
    private fileStates: Map<string, FileState> = new Map();
    private isRunning = false;
    private onProgress?: (message: string) => void;

    setProgressCallback(callback: (message: string) => void): void {
        this.onProgress = callback;
    }

    private log(message: string): void {
        if (this.onProgress) {
            this.onProgress(message);
        }
        console.log(`[WikiScheduler] ${message}`);
    }

    async start(): Promise<void> {
        if (this.isRunning) return;
        
        const config = getWikiConfig();
        if (!config.folderPath) {
            this.log('No wiki folder configured');
            return;
        }

        this.isRunning = true;
        this.log(`Starting wiki scheduler for: ${config.folderPath}`);
        
        await this.ingestAll();
        
        if (config.schedule > 0) {
            this.intervalId = window.setInterval(async () => {
                await this.ingestAll();
            }, config.schedule * 60 * 1000);
            
            this.log(`Scheduled re-indexing every ${config.schedule} minutes`);
        }
    }

    stop(): void {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        this.log('Wiki scheduler stopped');
    }

    async ingestAll(): Promise<void> {
        if (!this.isRunning) return;
        
        const config = getWikiConfig();
        if (!config.folderPath) return;

        try {
            this.log('Starting wiki ingestion...');
            
            const response = await window.__TAURI__.invoke('list_directory_files', {
                directory: config.folderPath,
            });
            
            const files = response as Array<{ name: string; path: string; is_dir: boolean }>;
            const mdFiles = files.filter(f => !f.is_dir);
            
            let processed = 0;
            let changed = 0;
            
            for (const file of mdFiles) {
                try {
                    const fileData = await window.__TAURI__.invoke('read_file', {
                        path: file.path,
                    });
                    
                    const data = fileData as { path: string; name: string; content: string; size: number; modified: number };
                    const currentState = { path: file.path, mtime: data.modified };
                    
                    const previousState = this.fileStates.get(file.path);
                    
                    if (!previousState || previousState.mtime < data.modified) {
                        this.log(`Changed: ${data.name}`);
                        await deleteChunksByFile(file.path);
                        
                        const chunks = chunkMarkdown(
                            data.content,
                            data.name,
                            data.path,
                            config.chunkSize,
                        );
                        
                        if (chunks.length > 0) {
                            await addChunks(chunks);
                            changed++;
                        }
                    }
                    
                    this.fileStates.set(file.path, currentState);
                    processed++;
                    
                } catch (error) {
                    this.log(`Error processing ${file.name}: ${error}`);
                }
            }
            
            this.log(`Ingestion complete: ${processed} files processed, ${changed} changed`);
            
        } catch (error) {
            this.log(`Ingestion error: ${error}`);
        }
    }

    async getStats() {
        return await getStats();
    }
}

export const wikiScheduler = new WikiScheduler();
