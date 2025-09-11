// fetches raw wiki files from remote git at compile time. Git-service (GS)

import global from '../constants';

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';


// Configuration for content fetching
export interface ContentFetchConfig {
    repoUrl: string;
    branch: string;
    localPath: string;
    wikiContentPath: string;
    gitTimeout: number; // Timeout for git operations in milliseconds
    maxFileSize: number; // Maximum file size in bytes
}

// Raw page (.txt files saved in github repo) metadata
export interface RawPage {
    slug: string[],
    filePath: string,
    content: string,
    lastModified: Date,
    size: number
}


const defaultConfig: ContentFetchConfig = {
    repoUrl: 'https://github.com/lorearchive/law-content.git', //might change to SSH?
    branch: 'main',
    localPath: '.wiki', // Where to store the cloned repo
    wikiContentPath: 'wiki', // Path within the repo containing wiki files
    gitTimeout: 30000, // 30 seconds
    maxFileSize: 10 * 1024 * 1024, // 10MB
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


// Validate and sanitize file paths to prevent directory traversal
function sanitizePath(inputPath: string): string {
    // Remove any path traversal attempts
    const sanitized = path.normalize(inputPath).replace(/^(\.\.[\/\\])+/, '')
    return sanitized
}


// Execute git command with timeout and error handling
function executeGitCommand(command: string, timeout: number): void {
    try {
        execSync(command, {
            stdio: 'pipe', // Capture output instead of inheriting
            timeout,
            encoding: 'utf8',
        })

    } catch (e: any) {
        throw new GitServiceError( `LAWE: Git command failed: ${command}`, e );
    }
}

/**
 * Fetch wiki content from a remote Git repository
 * @param config Fetching configuration
 * @returns Path to the local content directory
 */

export async function fetchWikiContent( config: Partial<ContentFetchConfig> = {} ): Promise<string> {
    const finalConfig = { ...defaultConfig, ...config };
  
    // validate config
    if (!finalConfig.repoUrl || !finalConfig.branch) {
        throw new GitServiceError('LAWE: Repository URL and branch are required');
    }

    // Sanitize paths
    const localPath = sanitizePath(finalConfig.localPath);
    const wikiContentPath = sanitizePath(finalConfig.wikiContentPath);

    try {
        const repoExists = await directoryExists(localPath);
    
        if (repoExists) {
            // Verify it's actually a git repository
            const gitDirExists = await directoryExists(path.join(localPath, '.git'));
            if (!gitDirExists) {
                throw new GitServiceError(`LAWE: Directory '${localPath}' exists but is not a git repository`);
            }

            console.log('LAWE: Updating existing wiki content repository...');
      
            // Reset local changes and pull latest
            executeGitCommand( `cd "${localPath}" && git reset --hard HEAD && git pull origin ${finalConfig.branch}`, finalConfig.gitTimeout );
        
        } else {
            console.log('LAWE: Cloning wiki content repository...')
      
            executeGitCommand( `git clone --depth 1 --single-branch --branch ${finalConfig.branch} "${finalConfig.repoUrl}" "${localPath}"`, finalConfig.gitTimeout );
        }

        const contentFullPath = path.join(localPath, wikiContentPath)
    
        if (!(await directoryExists(contentFullPath))) {
                throw new ContentValidationError(
                `LAWE: Wiki content directory '${wikiContentPath}' not found in repository`
            )
        }

        console.log(`LAWE: Wiki content successfully fetched to: ${contentFullPath}`);
        return contentFullPath;
    
    } catch (e) {
        if (e instanceof GitServiceError) {
            throw e
        }
    
        console.error('LAWE: Error fetching wiki content:', e);
        throw new GitServiceError('LAWE: Failed to fetch wiki content', e as Error);
    }
}

// validate file size and content 
async function validateWikiFile(filePath: string, maxSize: number): Promise<void> {
    try {
        const stats = await fs.stat(filePath);
    
        if (stats.size > maxSize) {
            throw new ContentValidationError( `LAWE: File '${filePath}' exceeds maximum size limit (${maxSize} bytes)` );
        }
    
        if (stats.size === 0) {
            console.warn(`LAWE: Warning: Empty file found: ${filePath}`);
        }
    
    } catch (e) {
        if (e instanceof ContentValidationError) {
            throw e;
        }
        throw new ContentValidationError(`LAWE: Cannot access file: ${filePath}`, e as Error);
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
        
        console.log(`LAWE: [DEBUG] Running git command: ${command}`);
        
        const result = execSync(command, {
            stdio: 'pipe',
            timeout: 5000, // 5 second timeout for individual git log commands
            encoding: 'utf8',
        });
        
        const commitDateStr = result.trim();
        console.log(`LAWE: [DEBUG] Git result for ${relativePath}: "${commitDateStr}"`);
        
        if (!commitDateStr) {
            // If no commit found for this file, fall back to file modification time
            console.warn(`LAWE: No git history found for ${relativePath}, using file modification time`);
            const stats = await fs.stat(filePath);
            return stats.mtime;
        }
        
        const commitDate = new Date(commitDateStr);
        console.log(`LAWE: [DEBUG] Parsed commit date for ${relativePath}: ${commitDate.toISOString()}`);
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

/**
 * Get all wiki pages from the content directory
 * @param contentPath Path to the local content directory
 * @param config Configuration options
 * @returns Array of objects with page paths and content
 */
export async function getAllPages( contentPath: string, config: Partial<Pick<ContentFetchConfig, 'maxFileSize'>> = {} ): Promise<RawPage[]> {

    const finalConfig = { ...defaultConfig, ...config };
    const pages: RawPage[] = [];

    // Validate content path
    if (!(await directoryExists(contentPath))) {
        throw new ContentValidationError(`LAWE: Content directory does not exist: ${contentPath}`);
    }

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
                        // Validate file before processing
                        await validateWikiFile(entryPath, finalConfig.maxFileSize);
              
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
                        global.lastMod[slugPath] = lastModified
                        
                        // Debug logging
                        console.log(`LAWE: [DEBUG] ${slugPath} -> ${lastModified.toISOString()} (${gitDirExists ? 'git commit' : 'file mtime'})`);
              
                        pages.push({ 
                            slug,
                            filePath: entryPath,
                            content: content.trim(), // Remove leading/trailing whitespace
                            lastModified,
                            size: stats.size
                        });
              
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
    
    // Debug: Print summary of all lastMod dates
    console.log('\nLAWE: [DEBUG] Summary of lastMod dates:');
    Object.entries(global.lastMod).forEach(([slug, date]) => {
        console.log(`  ${slug}: ${date.toISOString()}`);
    });
    
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
    
        await validateWikiFile(filePath, defaultConfig.maxFileSize);
    
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

/**
 * Clean up local repository (useful for development/testing)
 * @param config Configuration options
 */
export async function cleanupLocalRepo( config: Partial<ContentFetchConfig> = {} ): Promise<void> {
  
    const finalConfig = { ...defaultConfig, ...config };
    const localPath = sanitizePath(finalConfig.localPath);
  
    try {
        if (await directoryExists(localPath)) {
            await fs.rm(localPath, { recursive: true, force: true });
            console.log(`LAWE: Cleaned up local repository: ${localPath}`);
        }
    } catch (e) {
        throw new GitServiceError(`LAWE: Failed to cleanup local repository: ${localPath}`, e as Error);
    }
}

