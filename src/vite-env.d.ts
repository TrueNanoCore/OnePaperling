/// <reference types="vite/client" />

// KaTeX mhchem extension declaration
declare module "katex/dist/contrib/mhchem.mjs" {
    const mhchem: any;
    export default mhchem;
}

// Tauri API type declarations
declare global {
    interface Window {
        __TAURI__: {
            invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
            dialog: {
                open: (options?: { directory?: boolean; multiple?: boolean }) => Promise<string | string[] | null>;
            };
        };
    }
}

export {};
