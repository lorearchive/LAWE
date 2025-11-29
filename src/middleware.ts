// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { initWasm, getWasmModule } from './utils/wasm-loader.ts';

let wasmInitialized = false;

export const onRequest = defineMiddleware(async (context, next) => {
  if (!wasmInitialized) {
    try {
      await initWasm();
      wasmInitialized = true;
    } catch (error) {
      console.error('Failed to initialize WASM, falling back to JS implementation:', error);
      // Fall back
      return jsMiddleware(context, next);
    }
  }
  
  try {
    const wasmModule = getWasmModule();
    const url = context.url;
    const urlStr = url.toString();
    
    // Call the Rust function
    const redirectUrl = wasmModule.redirect_to_lowercase(urlStr);
    
    if (redirectUrl) {
      return Response.redirect(redirectUrl, 301);
    }
    
    return next();
  } catch (e) {
    console.error('Error in WASM middleware, falling back to JS implementation:', e);
    // Fall back 
    return jsMiddleware(context, next);
  }
});

// JavaScript fallback implementation
function jsMiddleware(context: any, next: any) {
  const url = context.url;
  const pathname = url.pathname;
  
  // Check if the pathname contains uppercase letters
  if (pathname !== pathname.toLowerCase()) {
    // Convert to lowercase and redirect
    const lowercasePathname = pathname.toLowerCase();
    const searchParams = url.search;
    const hash = url.hash;
    
    // Construct the new URL
    const newUrl = `${url.protocol}//${url.host}${lowercasePathname}${searchParams}${hash}`;
    
    // Return a permanent redirect to the lowercase version
    return Response.redirect(newUrl, 301);
  }
  
  return next();
}