import { getImage } from 'astro:assets'
import type { ASTNode } from '../scripts/Parsing/parser';


export default class ImageOptimiser {

    private cache = new Map<string, Promise<any>>();

    async optimizeImage( url: string, options: ASTNode ): Promise<string> { const cacheKey = `${url}-${JSON.stringify(options)}`;
    
        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, this.processImage(url, options));
        }

        const result = await this.cache.get(cacheKey);
        return result.html;
    }

    private async processImage(url: string, options: ASTNode) {

        const width = options.width ? parseInt(options.width, 10) : undefined;
        
        const optimized = await getImage({
            src: url,
            width: width,
            format: options.format,
            quality: 80
        })

        const html = `<img 
            src="${optimized.src}" 
            ${optimized.attributes.width ? `width="${optimized.attributes.width}"` : ''}
            ${options.alt ? `alt="${options.alt}"` : 'alt=""'}
            loading="lazy"
        />`

        return { html, src: optimized.src, attributes: optimized.attributes };
    }
}