import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react(),
        dts({
            include: ['src/style-zx', 'src/vite-plugin-style-zx'],
            insertTypesEntry: true,
            tsconfigPath: './tsconfig.build.json',
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/style-zx/index.ts'),
                plugin: resolve(__dirname, 'src/vite-plugin-style-zx/index.ts'),
            },
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'vite', 'magic-string', '@babel/parser', '@babel/traverse', '@babel/types', 'crypto'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
});
