// src/middleware.ts
import type { MiddlewareHandler } from 'astro';
import { initWasm } from './utils/wasm-loader';
import { redirect_to_lowercase } from '../rust-wasm/pkg/rust_wasm.js';

export const onRequest: MiddlewareHandler = async (context, next) => {
    // Initialize WASM once at startup
    await initWasm();
    
    const currentUrl = context.url.toString();
    const redirectUrl = redirect_to_lowercase(currentUrl);
    
    if (redirectUrl) {
      return context.redirect(redirectUrl, 301);
    }
    
    return next()
}