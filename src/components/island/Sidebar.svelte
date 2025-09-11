<script lang="ts" context="module">
    import type { ContentFetchConfig, RawPage } from "../../utils/git-service";
    import { getAllPages, fetchWikiContent } from "../../utils/git-service";

    interface DirectoryNode {
        name: string;
        type: 'file' | 'directory';
        slug: string[];
        children: Map<string, DirectoryNode>;
        page?: RawPage;
    }

    function buildDirectoryTree(pages: RawPage[]): DirectoryNode {
        const root: DirectoryNode = {
            name: 'wiki',
            type: 'directory',
            slug: [],
            children: new Map()
        };

        for (const page of pages) {
            let current = root;
            
            // Navigate/create path structure
            for (let i = 0; i < page.slug.length; i++) {
                const segment = page.slug[i];
                
                if (!current.children.has(segment)) {
                    const isFile = i === page.slug.length - 1;
                    current.children.set(segment, {
                        name: segment,
                        type: isFile ? 'file' : 'directory',
                        slug: page.slug.slice(0, i + 1),
                        children: new Map(),
                        page: isFile ? page : undefined
                    });
                }
                
                current = current.children.get(segment)!;
            }
        }

        return root;
    }

    function treeToHTML(node: DirectoryNode, isRoot: boolean = true): string {
        if (isRoot && node.children.size === 0) {
            return '<ol><li class="empty">No wiki files found</li></ol>';
        }
        
        const children = Array.from(node.children.values())
            .sort((a, b) => {
                // Directories first, then files, both alphabetically
                if (a.type !== b.type) {
                    return a.type === 'directory' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

        if (children.length === 0 && !isRoot) {
            return '';
        }

        let html = '<ol>\n';
        
        for (const child of children) {
            const slugPath = child.slug.join('/');
            const lastMod = child.page?.lastModified.toISOString() || '';
            
            html += `    <span class="name">${child.name}</span>\n`;
            html += `  <li class="${child.type}" data-slug="${slugPath}" data-last-modified="${lastMod}">\n`;
            
            if (child.type === 'directory' && child.children.size > 0) {
                const childrenHTML = treeToHTML(child, false);
                if (childrenHTML) {
                    html += indentHTML(childrenHTML, 2);
                }
            }
            
            html += `  </li>\n`;
        }
        
        html += '</ol>\n';
        return html;
    }

    function indentHTML(html: string, spaces: number): string {
        const indent = ' '.repeat(spaces);
        return html.split('\n')
            .map(line => line.length > 0 ? indent + line : line)
            .join('\n');
    }

    /**
     * Generate HTML directory structure as ol/li from wiki content
     * @param contentPath Path to the local content directory
     * @param config Configuration options
     * @returns HTML string with ol/li structure
     */
    export async function generateWikiDirectoryHTML(
        contentPath: string, 
        config: Partial<Pick<ContentFetchConfig, 'maxFileSize'>> = {}
    ): Promise<string> {
        const pages = await getAllPages(contentPath, config);
        
        // Build directory tree from flat page list
        const tree = buildDirectoryTree(pages);
        
        // Convert tree to HTML
        return treeToHTML(tree);
    }

const contentPath = await fetchWikiContent();
const wikiHTML = await generateWikiDirectoryHTML(contentPath);
</script>

{@html wikiHTML}