import initWasmBindgen from '../../rust-wasm/pkg/rust_wasm.js';

let wasmInitialized = false;

export async function initWasm() {
    if (wasmInitialized) return;

    try {
        // 1. Define the URL where we host the WASM file
        // This works in both Browser and Netlify Functions (Server)
        const wasmUrl = '/wasm/rust_wasm_bg.wasm';

        // 2. Fetch the binary data
        // Note: In Netlify Functions, we rely on the global fetch available in Node 18+
        const response = await fetch(wasmUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch WASM: ${response.statusText} (${response.status})`);
        }

        const wasmBuffer = await response.arrayBuffer();

        // 3. Initialize using the buffer
        // This avoids the glue code trying to fetch the file itself (which causes path issues)
        await initWasmBindgen(wasmBuffer);

        wasmInitialized = true;
        console.log('WASM initialized successfully (via Public URL)');
    } catch (error) {
        console.error('Failed to initialize WASM:', error);
        throw error;
    }
}