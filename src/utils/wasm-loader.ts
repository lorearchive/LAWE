
import initWasmBindgen from '../../rust-wasm/pkg/rust_wasm.js';

let wasmInitialized = false;

export async function initWasm() {
    if (wasmInitialized) return;

    try {
        if (import.meta.env.SSR) {
            // Node.js environment - load WASM from filesystem
            const { readFile } = await import('fs/promises');
            const { fileURLToPath } = await import('url');
            const { dirname, join } = await import('path');

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);

            // Path to WASM file relative to this loader
            const wasmPath = join(__dirname, '../../rust-wasm/pkg/rust_wasm_bg.wasm');

            const wasmBuffer = await readFile(wasmPath);

            // Initialize wasm-bindgen with buffer
            await initWasmBindgen(wasmBuffer);
        } else {
            // Browser environment
            await initWasmBindgen();
        }

        wasmInitialized = true;
        console.log('WASM initialized successfully');
    } catch (error) {
        console.error('Failed to initialize WASM:', error);
        throw error;
    }
}
