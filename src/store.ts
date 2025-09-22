// this file acts like a global state during compile time.

export interface global {
    lastMod: Record<string, Date>
}


const global: global = {
    
    lastMod: { } // last modified date saved into an object, the key is the page ID.
} 

export default global