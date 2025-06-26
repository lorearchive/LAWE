// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { processAllPages } from './src/utils/pages-processor'
import { fetchWikiContent, getAllWikiPages } from './src/utils/git-service'
import tailwindcss from '@tailwindcss/vite';



// Process pages at build time
let processedPagesMap = new Map();


async function initializeProcessedPages() {
    try {
        const contentPath = await fetchWikiContent()
        const rawPages = await getAllWikiPages(contentPath)
        const { processedPages } = await processAllPages(rawPages);
    
        // Create a map for quick lookups
        processedPages.forEach(page => {
            const urlPath = '/' + page.slug.join('/');
            processedPagesMap.set(urlPath === '/' ? '/' : urlPath, page);
        });
    
        console.log(`LAWE ASTRO CONFIG: Loaded ${processedPages.length} processed pages for sitemap`);
    }
     catch (error) {
        console.error('LAWE ASTRO CONFIG: Failed to initialize processed pages:', error);
    }
}


await initializeProcessedPages()


// https://astro.build/config
export default defineConfig({

    site: 'https://lorearchive.org',
    build: {},

    integrations: [
        sitemap({
            serialize(item) {
                const urlPath = item.url.replace('https://lorearchive.org', '') || '/'
                const processedPage = processedPagesMap.get(urlPath)

                if (processedPage && processedPage.metadata.lastModified) {
                    item.lastmod = processedPage.metadata.lastModified.toISOString()
                } else {
                    console.warn(`LAWE ASTRO CONFIG: No processed page found for ${urlPath}, using current date`)
                    item.lastmod = new Date().toISOString()
                }

                return item
            }
    })],

    

    vite: {
        plugins: [
            {
                name: "content fetcher",
                buildStart: async () => {
                    console.log('Fetching content from remote repository...')
                }
            },
        
            tailwindcss()]
    }

});