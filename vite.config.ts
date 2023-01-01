import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite';
import { join } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import watch from "rollup-plugin-watch";

export default defineConfig({
    root: 'extension',
    build: {
        outDir: join(__dirname, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            watch: { include: ['**/*'] },
            input: {
                devtools: join(__dirname, 'extension/devtools.html'),
                panel: join(__dirname, 'extension/panel.html')
            },
            plugins: [watch({ dir: 'extension' })]
        },
        minify: false
    },
    plugins: [
        svelte(),
        viteStaticCopy({
            targets: [
                { src: 'manifest.json', dest: '' },
                { src: 'assets', dest: '' }
            ]
        })
    ]
});