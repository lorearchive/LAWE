<script lang="ts" module>

    interface DirectoryNode {
        name: string;
        type: 'file' | 'directory';
        path: string;
        children: Map<string, DirectoryNode>;
        fullPath?: string; // Original route path
    }

    function buildFilesystemFromRoutes(routes: string[]): DirectoryNode {
        const root: DirectoryNode = {
            name: 'root',
            type: 'directory',
            path: '',
            children: new Map()
        };

        for (const route of routes) {

            const cleanPath = route.replace(/^\.+\//, '');
            const segments = cleanPath.split('/').filter(segment => segment.length > 0).slice(2);
            
            let current = root;
            
            // Navigate/create path structure
            for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const isFile = i === segments.length - 1;
            const currentPath = segments.slice(0, i + 1).join('/');
            
            if (!current.children.has(segment)) {
                current.children.set(segment, {
                    name: isFile ? segment.replace(/\.txt$/, '') : segment,
                    type: isFile ? 'file' : 'directory',
                    path: isFile ? currentPath.replace(/\.txt$/, '') : currentPath,
                    children: new Map(),
                    fullPath: isFile ? route : undefined
                });
            }
            
            current = current.children.get(segment)!;
            }
        }
        
        return root;
    }
</script>

<script lang="ts">
    const { routes } = $props<{ routes: string[] }>();
    let tree: DirectoryNode | null = $state(null);

    $effect(() => {
        if (routes && routes.length > 0) {
            tree = buildFilesystemFromRoutes(routes);
        } else {
            tree = null;
        }
    });


</script>

{#snippet treeToHTMLSnippet(node: DirectoryNode, isRoot: boolean = true)}

    {#if isRoot && node.children.size === 0}
        <ul><li class="empty">No files found</li></ul>
    
    {:else}
    
        {@const children = Array.from(node.children.values())
            .sort((a, b) => {
            // Files first, then directories, both alphabetically
                if (a.type !== b.type) {
                    return a.type === 'file' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            })
        }
    
        {#if children.length > 0}
            <ul>
                {#each children as child}
                    <li class="{child.type}" data-path="{child.path}">
                        <a href={`/wiki/${child.path}`} class="a-no-style">
                             <span class="name">
                                {child.name}
                            </span>
                        </a>
                       
                        
                        {#if child.type === 'directory' && child.children.size > 0}
                            {@render treeToHTMLSnippet(child, false)}
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    {/if}
{/snippet}

{#if tree}
    {@render treeToHTMLSnippet(tree)}
{:else}
    <p>No routes provided</p>
{/if}

<style>
    ul {
        list-style: none;
        padding-left: 1.5rem;
        margin: 0.5rem 0;
    }

    li {
        margin: 0.25rem 0;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
    }
    
    li:hover {
        background-color: #f5f5f5;
    }
    
    li.directory {
        font-weight: 500;
    }
    
    li.file {
        color: #666;
    }
    
    .name {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .empty {
        color: #999;
        font-style: italic;
    }
</style>