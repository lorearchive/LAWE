import initWasmBindgen from '../../rust-wasm/pkg/rust_wasm.js';
// Only import 'fs' if we are in a Node environment
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

let wasmInitialized = false;

export async function initWasm() {
    if (wasmInitialized) return;

    try {
        let wasmBuffer: ArrayBuffer;

        if (typeof window === 'undefined') {
            /**
             * SERVER SIDE (Node.js / Build time)
             * Fetch won't work for local files here. Use 'fs' instead.
             **/
            // Adjust the path to where your WASM file actually sits on your disk
            const wasmPath = join(process.cwd(), 'public', 'wasm', 'rust_wasm_bg.wasm');
            const buffer = await readFile(wasmPath);
            wasmBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        } else {
            /**
             * CLIENT SIDE (Browser)
             * Standard fetch works here.
             **/
            const wasmUrl = '/wasm/rust_wasm_bg.wasm';
            const response = await fetch(wasmUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch WASM: ${response.statusText} (${response.status})`);
            }
            wasmBuffer = await response.arrayBuffer();
        }

        await initWasmBindgen({ module_or_path: wasmBuffer });
        wasmInitialized = true;
        console.log('WASM initialized successfully');
    } catch (error) {
        console.error('Failed to initialize WASM:', error);
        throw error;
    }
}