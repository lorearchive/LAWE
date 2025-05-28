// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({

    site: 'https://lorearchive.org',

    build: {},

    integrations: [],

    

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