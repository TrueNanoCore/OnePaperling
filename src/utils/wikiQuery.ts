/**
 * LLM Wiki query engine.
 * 
 * Performs semantic + keyword search over indexed chunks.
 * Falls back to keyword-only if embeddings are not available.
 */

import { searchChunks, getStats } from './wikiStore';

export interface WikiSearchResult {
    chunkId: string;
    fileName: string;
    filePath: string;
    heading: string;
    content: string;
    tokens: number;
    score: number;
}

export interface WikiQueryResult {
    results: WikiSearchResult[];
    totalChunks: number;
    queryTime: number;
}

export async function queryWiki(
    query: string,
    limit: number = 10,
): Promise<WikiQueryResult> {
    const startTime = Date.now();
    
    if (!query.trim()) {
        return {
            results: [],
            totalChunks: 0,
            queryTime: Date.now() - startTime,
        };
    }

    try {
        const chunks = await searchChunks(query, limit);
        
        const results: WikiSearchResult[] = chunks.map(chunk => ({
            chunkId: chunk.id,
            fileName: chunk.fileName,
            filePath: chunk.filePath,
            heading: chunk.heading,
            content: chunk.content,
            tokens: chunk.tokens,
            score: 1,
        }));
        
        return {
            results,
            totalChunks: results.length,
            queryTime: Date.now() - startTime,
        };
    } catch (error) {
        console.error('Wiki query error:', error);
        return {
            results: [],
            totalChunks: 0,
            queryTime: Date.now() - startTime,
        };
    }
}

export async function getWikiContext(
    query: string,
    maxTokens: number = 2000,
): Promise<string> {
    const result = await queryWiki(query, 10);
    
    if (result.results.length === 0) {
        return '';
    }
    
    let context = '# Wiki Knowledge Base\n\n';
    let currentTokens = 0;
    
    for (const r of result.results) {
        const entry = `## ${r.heading}\n**Source:** ${r.fileName}\n\n${r.content}\n\n---\n\n`;
        const entryTokens = r.tokens;
        
        if (currentTokens + entryTokens > maxTokens) {
            break;
        }
        
        context += entry;
        currentTokens += entryTokens;
    }
    
    return context;
}

export async function getWikiStats() {
    return await getStats();
}
