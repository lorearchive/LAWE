// @ts-check
import global from './src/constants'
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite';
import { processAllPages } from './src/utils/pages-processor'
import { fetchWikiContent, getAllPages } from './src/utils/git-service'

// https://astro.build/config
export default defineConfig({
    site: 'https://lorearchive.org',
    build: {},


    integrations: [
        sitemap({
            serialize(item) {
                // Extract the page path from the URL
                const url = new URL(item.url);
                let pathname = url.pathname;
                
                // Remove leading/trailing slashes
                pathname = pathname.replace(/^\/+|\/+$/g, '');
                
                // Remove the 'wiki/' prefix if it exists, since that's part of the content path
                // not the actual slug stored in global.lastMod
                const slugPath = pathname.replace(/^wiki\//, '');
                
                // Look up the lastMod date for this page
                const lastMod = global.lastMod[slugPath];
                
                console.log(`LAWE: [SITEMAP DEBUG] URL: ${item.url}, pathname: ${pathname}, slugPath: ${slugPath}`);
                
                if (lastMod) {
                    console.log(`LAWE: [SITEMAP] ${slugPath} -> ${lastMod.toISOString()}`);
                    return {
                        url: item.url,
                        lastmod: lastMod.toISOString(),
                        links: item.links
                    };
                
                } else {
                    console.warn(`LAWE: [SITEMAP] No lastMod found for ${slugPath}, available keys:`, Object.keys(global.lastMod));
                    return {
                        url: item.url,
                        lastmod: new Date().toISOString(),
                        links: item.links
                    };
                }
            }
        })
    ],
  
    vite: {
        plugins: [
            {
                name: "content fetcher",
                buildStart: async () => {
                console.log('LAWE: Fetching content from remote repository...');
                
                try {
                    const contentPath = await fetchWikiContent();
                    const pages = await getAllPages(contentPath);
                    
                    await processAllPages(pages);
                    
                    console.log(`LAWE: Content fetching complete. Processed ${pages.length} pages.`);
                    console.log(`LAWE: global.lastMod contains ${Object.keys(global.lastMod).length} entries`);
                    
                } catch (error) {
                    console.error('LAWE: Error during content fetching:', error);
                    throw error
                }
                }
            },
            
            tailwindcss()
        ]
    }
});