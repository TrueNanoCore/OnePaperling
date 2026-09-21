/**
 * Markdown chunking engine for LLM Wiki.
 * 
 * Uses heading-aware chunking: splits markdown by `#` headings,
 * creates chunks with a maximum token count.
 * 
 * Token estimation: ~4 characters per token (conservative estimate).
 */

export interface Chunk {
    fileId: string;
    fileName: string;
    filePath: string;
    heading: string;
    content: string;
    tokens: number;
}

const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}

interface Heading {
    level: number;
    text: string;
    index: number;
}

function extractHeadings(content: string): Heading[] {
    const headings: Heading[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
            headings.push({
                level: match[1].length,
                text: match[2].trim(),
                index: i,
            });
        }
    }
    
    return headings;
}

function chunkByHeadings(content: string, fileName: string, filePath: string, maxTokens: number): Chunk[] {
    const headings = extractHeadings(content);
    const chunks: Chunk[] = [];
    
    if (headings.length === 0) {
        const contentTokens = estimateTokens(content);
        if (contentTokens > 0) {
            chunks.push({
                fileId: filePath,
                fileName,
                filePath,
                heading: 'Introduction',
                content: content.substring(0, maxTokens * CHARS_PER_TOKEN),
                tokens: contentTokens,
            });
        }
        return chunks;
    }
    
    for (let i = 0; i < headings.length; i++) {
        const current = headings[i];
        const next = headings[i + 1];
        
        const start = current.index;
        const end = next ? next.index : content.split('\n').length;
        
        const sectionLines = content.split('\n').slice(start, end);
        let sectionContent = sectionLines.join('\n');
        
        const sectionTokens = estimateTokens(sectionContent);
        
        if (sectionTokens <= maxTokens) {
            chunks.push({
                fileId: filePath,
                fileName,
                filePath,
                heading: current.text,
                content: sectionContent,
                tokens: sectionTokens,
            });
        } else {
            const subChunks = subChunkSection(sectionContent, current.text, maxTokens);
            for (const subChunk of subChunks) {
                chunks.push({
                    fileId: filePath,
                    fileName,
                    filePath,
                    heading: `${current.text} (${subChunk.suffix})`,
                    content: subChunk.content,
                    tokens: subChunk.tokens,
                });
            }
        }
    }
    
    return chunks;
}

interface SubChunk {
    content: string;
    tokens: number;
    suffix: string;
}

function subChunkSection(content: string, _parentHeading: string, maxTokens: number): SubChunk[] {
    const subChunks: SubChunk[] = [];
    const lines = content.split('\n');
    let currentContent = '';
    let currentTokens = 0;
    let lineCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineTokens = estimateTokens(line + '\n');
        
        if (currentTokens + lineTokens > maxTokens && currentContent.length > 0) {
            subChunks.push({
                content: currentContent,
                tokens: currentTokens,
                suffix: `part ${subChunks.length}`,
            });
            currentContent = '';
            currentTokens = 0;
        }
        
        currentContent += line + '\n';
        currentTokens += lineTokens;
        lineCount++;
    }
    
    if (currentContent.length > 0) {
        subChunks.push({
            content: currentContent,
            tokens: currentTokens,
            suffix: lineCount <= maxTokens ? 'continuation' : `part ${subChunks.length + 1}`,
        });
    }
    
    return subChunks;
}

export function chunkMarkdown(
    content: string,
    fileName: string,
    filePath: string,
    maxTokens: number = 500,
): Chunk[] {
    return chunkByHeadings(content, fileName, filePath, maxTokens);
}
