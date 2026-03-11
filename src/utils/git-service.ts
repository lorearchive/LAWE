// fetches raw wiki files from remote git at compile time. Git-service (GS)

import global from '../store';

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';



// Raw page (.txt files saved in github repo) metadata
export interface RawPage {
    slug: string[],
    filePath: string,
    content: string,
    lastModified: Date,
    size: number
}

export interface PageMeta {
    id: string
    title: string
    slug: string[]
    filePath: string
    lastModified: Date
    size: number
}


// Custom error classes for better error handling
export class GitServiceError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'GitServiceError';
    }
}

export class ContentValidationError extends GitServiceError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ContentValidationError';
    }
}


// check if a directory exists
async function directoryExists(dirPath: string): Promise<boolean> {
    try {
        const stat = await fs.stat(dirPath);
        return stat.isDirectory();
    } catch {
        return false;
    }
}



// Generate URL-safe slug from file path components
function generateSlug(pathComponents: string[]): string[] {
    return pathComponents.map(component => 
        component
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+|-+$/g, '')
    ).filter(Boolean)
}

// Helper function to get the last commit date for a specific file
async function getLastCommitDate(filePath: string, repoPath: string): Promise<Date> {
    try {
        const relativePath = path.relative(repoPath, filePath);
        const command = `cd "${repoPath}" && git log -1 --format="%ci" -- "${relativePath}"`;
        
        console.log(`LAWE: Running git command: ${command}`);
        
        const result = execSync(command, {
            stdio: 'pipe',
            timeout: 5000, // 5 second timeout for individual git log commands
            encoding: 'utf8',
        });
        
        const commitDateStr = result.trim();
        
        if (!commitDateStr) {
            // If no commit found for this file, fall back to file modification time
            console.warn(`LAWE: No git history found for ${relativePath}, using file modification time`);
            const stats = await fs.stat(filePath);
            return stats.mtime;
        }
        
        const commitDate = new Date(commitDateStr);
        return commitDate;
    } catch (e) {
        console.warn(`LAWE: Error getting git commit date for ${filePath}:`, e);
        // Fall back to file modification time
        try {
            const stats = await fs.stat(filePath);
            console.log(`LAWE: [DEBUG] Fallback to file mtime for ${filePath}: ${stats.mtime.toISOString()}`);
            return stats.mtime;
        } catch (statError) {
            // If we can't even get file stats, return current date as last resort
            console.error(`LAWE: Cannot get file stats for ${filePath}:`, statError);
            return new Date();
        }
    }
}

// Ensure metadata directory exists
async function checkMetaDir( wikiPath: string ): Promise<string> {
    const metaDir = path.join(wikiPath, 'meta');
    
    try {
        await fs.access(metaDir);
    } catch {
        await fs.mkdir(metaDir, { recursive: true });
        console.log(`LAWE: Created metadata directory: ${metaDir}`);
    }
    
    return metaDir;
}

// Save metadata for a single page
async function savePageMetadata(metaDir: string, metadata: PageMeta): Promise<void> {
    const fileName = metadata.id + '.json';
    const filePath = path.join(metaDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), 'utf-8');
}

/**
 * Get all wiki pages from the content directory
 * @param contentPath Path to the local content directory
 * @param config Configuration options
 * @returns Array of objects with page paths and content
 */
export async function getAllPages(): Promise<RawPage[]> {

    const pages: RawPage[] = [];

    const contentPath = "public/content/wiki"
    // Validate content path
    if (!(await directoryExists(contentPath))) {
        throw new ContentValidationError(`LAWE: Content directory does not exist: ${contentPath}`);
    }

    const wikiPath = path.dirname(contentPath); // Get .wiki directory
    const metaDir = await checkMetaDir(wikiPath);


    // Find the git repository root (should be the parent of contentPath)
    const repoPath = path.dirname(contentPath);
    const gitDirExists = await directoryExists(path.join(repoPath, '.git'));
    if (!gitDirExists) {
        console.warn('LAWE: Git repository not found, falling back to file modification times');
    }

    // Recursive function to walk directory tree
    async function processDirectory(dirPath: string, parentSlug: string[] = []) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
            // Process entries in parallel for better performance
            await Promise.all( entries.map(async (entry) => {
                
                const entryPath = path.join(dirPath, entry.name);
          
                if (entry.isDirectory()) {
                    // Skip hidden directories and common ignore patterns
                    if (entry.name.startsWith('.') || entry.name === 'node_modules') return
            
                    // Process subdirectory recursively
                    await processDirectory(entryPath, [...parentSlug, entry.name])
            
                } else if (entry.isFile() && entry.name.endsWith('.txt')) {
            
                    try {
              
                        // Process wiki file
                        const pageName = entry.name.replace(/\.txt$/, '');
                        const slug = generateSlug([...parentSlug, pageName]);
              
                        // Read file content and get stats
                        const content = await fs.readFile(entryPath, 'utf-8');
                        const stats = await fs.stat(entryPath);
                        
                        // Get last commit date (falls back to file mtime if git fails)
                        const lastModified = gitDirExists 
                            ? await getLastCommitDate(entryPath, repoPath)
                            : stats.mtime;

                       const slugPath = slug.join("/");
                        global.lastMod[slugPath] = lastModified;

                        // Extract title (first line or filename)
                        const title = content.split('\n')[0].replace(/^#+\s*/, '') || pageName;

                        const pageData = { 
                            slug,
                            filePath: entryPath,
                            content: content.trim(),
                            lastModified,
                            size: stats.size
                        };

                        // Save metadata
                        const metadata: PageMeta = {
                            id: pageName,
                            title: title.trim().slice(6).slice(0, -6).trim(),
                            slug,
                            filePath: entryPath,
                            lastModified,
                            size: stats.size
                        };

                        await savePageMetadata(metaDir, metadata);
                                    
                        pages.push(pageData);
              
                    } catch (e) {
                        console.error(`LAWE: Error processing wiki file '${entryPath}':`, e);
                        // Continue processing other files instead of failing completely
                    }
                } else {
                    console.log(`LAWE: Unrecognized entry: ${entry.name}`)
                }
            }));
      
        } catch (e) {
            throw new ContentValidationError(`LAWE: Error reading directory '${dirPath}'`, e as Error);
        }
    }

    await processDirectory(contentPath);
  
    console.log(`LAWE: Successfully processed ${pages.length} wiki pages`);
    
    return pages;
}

/**
 * Get a single wiki page by its slug path
 * @param contentPath Path to the local content directory
 * @param slug Array representing the page path
 * @returns Page object or null if not found
 */
export async function getSinglePage( contentPath: string, slug: string[] ): Promise<RawPage | null> {
    try {
        const filePath = path.join(contentPath, ...slug) + '.txt';
    
        // Validate the constructed path is within content directory
        const resolvedPath = path.resolve(filePath);
        const resolvedContentPath = path.resolve(contentPath);
        
        if (!resolvedPath.startsWith(resolvedContentPath)) {
            throw new ContentValidationError('LAWE: Invalid file path: outside content directory');
        }
        
        const [content, stats] = await Promise.all([
            fs.readFile(filePath, 'utf-8'),
            fs.stat(filePath)
        ]);
    
        return { slug: generateSlug(slug), filePath, content: content.trim(), lastModified: stats.mtime, size: stats.size };
    
    } catch (e) {
        if (e instanceof ContentValidationError) throw e    
        return null // Page not found
    }
}

