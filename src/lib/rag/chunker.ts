import { ExtractedDocument } from "./extractor";

export interface Chunk {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  metadata?: Record<string, unknown>;
}

/**
 * Splits document into chunks based on a maximum character length,
 * preferring to split at paragraph breaks or sentences.
 */
export function chunkDocument(doc: ExtractedDocument, maxTokens: number = 800, overlap: number = 100): Chunk[] {
  // Rough token estimation: 1 token ~= 4 chars
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;
  
  const chunks: Chunk[] = [];
  let currentChunkIndex = 0;
  
  for (const page of doc.pages) {
    if (page.text.trim().length === 0) continue;
    
    const pageChunks = splitByLength(page.text, maxChars, overlapChars);
    
    for (const textChunk of pageChunks) {
      chunks.push({
        content: textChunk,
        chunkIndex: currentChunkIndex++,
        pageNumber: page.pageNumber
      });
    }
  }
  
  return chunks;
}

function splitByLength(text: string, maxChars: number, overlapChars: number): string[] {
  const result: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChars;
    
    if (endIndex < text.length) {
      // Try to find a good break point (double newline)
      let breakPoint = text.lastIndexOf('\n\n', endIndex);
      
      // If no paragraph break, try sentence break
      if (breakPoint <= startIndex) {
        breakPoint = text.lastIndexOf('. ', endIndex);
      }
      
      // If no sentence break, try word break
      if (breakPoint <= startIndex) {
        breakPoint = text.lastIndexOf(' ', endIndex);
      }
      
      // If still no break, just cut at maxChars
      if (breakPoint > startIndex) {
        endIndex = breakPoint;
      }
    }
    
    const chunkContent = text.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      result.push(chunkContent);
    }
    
    startIndex = endIndex - overlapChars;
    // ensure we progress
    if (startIndex <= result.length * (maxChars - overlapChars) - maxChars) {
       startIndex = endIndex; 
    }
    // prevent infinite loop if overlap is too big compared to progress
    if (startIndex <= text.length - maxChars && endIndex === text.length) {
       break;
    }
    if (endIndex >= text.length) {
      break;
    }
  }
  
  return result;
}
