import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import inspect from 'vite-plugin-inspect';
import { resolve } from 'path';

async function startDevServer() {
  const server = await createServer({
    // Configure Vite
    configFile: false,
    root: process.cwd(),
    server: {
      port: 3000,
      host: true,
      hmr: {
        port: 3001,
        overlay: true,
        clientPort: 3001,
        timeout: 5000
      }
    },
    plugins: [
      // React plugin with HMR
      react({
        fastRefresh: true,
        babel: {
          plugins: [
            ['@babel/plugin-transform-runtime'],
            ['babel-plugin-styled-components', { displayName: true, fileName: true }]
          ]
        }
      }),
      // Development inspection
      inspect({
        build: true,
        outputDir: '.vite-inspect'
      })
    ],
    resolve: {
      alias: {
        '@full/core': resolve(__dirname, 'src')
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: []
    },
    build: {
      sourcemap: true,
      minify: false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/index.ts')
        }
      }
    },
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      preprocessorOptions: {
        scss: {
          additionalData: '@import "./src/styles/variables.scss";'
        }
      }
    },
    json: {
      stringify: true
    },
    // Development features
    define: {
      __DEV__: 'true',
      __TEST__: 'false',
      __BROWSER__: 'true'
    },
    // Error handling
    customLogger: {
      info: (...args) => console.log('🔵', ...args),
      warn: (...args) => console.warn('🟡', ...args),
      error: (...args) => console.error('🔴', ...args),
      warnOnce: (...args) => console.warn('⚠️', ...args)
    }
  });

  // Start the server
  await server.listen();

  // Log server info
  server.printUrls();

  // Handle HMR
  if (process.env.NODE_ENV === 'development') {
    server.watcher.on('change', (path) => {
      console.log(`File ${path} changed, reloading...`);
    });

    server.watcher.on('add', (path) => {
      console.log(`File ${path} added, updating...`);
    });

    server.watcher.on('unlink', (path) => {
      console.log(`File ${path} removed, cleaning up...`);
    });
  }

  // Handle server shutdown
  const shutdown = async () => {
    console.log('\nShutting down dev server...');
    await server.close();
    process.exit();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the development server
startDevServer().catch((err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
}); 