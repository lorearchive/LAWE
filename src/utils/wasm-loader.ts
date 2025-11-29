let wasmModule: any = null;

export async function initWasm() {
    if (wasmModule) return wasmModule

    try {
        const wasmUrl = new URL('../../rust-wasm/pkg/rust_wasm_bg.wasm', import.meta.url)
        const { default: init } = await import('../../rust-wasm/pkg/rust_wasm.js')

        wasmModule = await init(wasmUrl)
        return wasmModule
    } catch (e) {
        console.error('Failed to init WASM module: ', e)
        throw e
    }
}


export function getWasmModule() {
    if (!wasmModule) throw new Error('WASM module not initialised. Call initWasm() first.')
    return wasmModule
}