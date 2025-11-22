import { defineConfig } from 'vite';
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
    plugins: [commonjs()],
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split Three.js into separate chunk for better caching
                    'three': ['three'],
                    // Split audio system into separate chunk (lazy load)
                    'audio': [
                        './src/audio/audio.js',
                        './src/audio/MusicPlayer.js'
                    ],
                    // Split particle system into separate chunk (lazy load)
                    'particles': ['./src/rendering/ParticleSystem.js'],
                },
            },
        },
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        // Target modern browsers for smaller bundle
        target: 'es2015',
        // Minify for production
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
            },
        },
        // Generate source maps for debugging
        sourcemap: true,
        // Chunk size warnings
        chunkSizeWarningLimit: 500,
    },
    server: {
        open: true,
        port: 3000,
    },
    optimizeDeps: {
        include: ['socket.io-client'],
    },
});
