// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({

    site: 'https://lorearchive.org',

    build: {},

    integrations: [sitemap()],

    

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