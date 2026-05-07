export function getPlugins({ minify, outputFile, vite }: {
    minify: any;
    outputFile: any;
    vite: any;
}): (import("rollup").Plugin<any> | {
    name: string;
    resolveId(source: any, importer: any): string | null;
} | null)[];
