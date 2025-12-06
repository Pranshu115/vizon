const path = require('path')

// Custom plugin to log file changes with timestamps (Vite-style)
class FileChangeLoggerPlugin {
  constructor() {
    this.changedFiles = new Map()
    this.batchTimeout = null
    this.pendingFiles = new Set()
  }

  formatTime() {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    })
  }

  logChanges() {
    if (this.pendingFiles.size === 0) return

    const timeStr = this.formatTime()
    const files = Array.from(this.pendingFiles)
    
    // Track and count file changes
    files.forEach(file => {
      const count = this.changedFiles.get(file) || 0
      this.changedFiles.set(file, count + 1)
    })

    // Format file paths
    const formattedFiles = files.map(file => {
      const relativePath = path.relative(process.cwd(), file)
      const displayPath = relativePath.startsWith('..') ? file : relativePath
      const repeatCount = this.changedFiles.get(file)
      const repeatStr = repeatCount > 1 ? ` (x${repeatCount})` : ''
      return `${displayPath}${repeatStr}`
    })

    // Log in Vite-style format
    console.log(
      `\x1b[90m${timeStr}\x1b[0m \x1b[36m[next]\x1b[0m \x1b[32mhmr update\x1b[0m \x1b[0m${formattedFiles.join(', ')}`
    )

    // Clear pending files and reset counters after delay
    this.pendingFiles.clear()
    setTimeout(() => {
      files.forEach(file => this.changedFiles.delete(file))
    }, 2000)
  }

  apply(compiler) {
    // Hook into file invalidation (when files change)
    compiler.hooks.invalid.tap('FileChangeLoggerPlugin', (fileName, changeTime) => {
      if (fileName) {
        this.pendingFiles.add(fileName)
        
        // Batch log changes (similar to Vite)
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout)
        }
        
        this.batchTimeout = setTimeout(() => {
          this.logChanges()
          this.batchTimeout = null
        }, 50) // Small delay to batch rapid changes
      }
    })

    // Hook into watch run (when webpack starts watching)
    compiler.hooks.watchRun.tap('FileChangeLoggerPlugin', (compilation) => {
      const changedFiles = compilation.modifiedFiles || new Set()
      if (changedFiles.size > 0) {
        changedFiles.forEach((file) => {
          this.pendingFiles.add(file)
        })
        
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout)
        }
        
        this.batchTimeout = setTimeout(() => {
          this.logChanges()
          this.batchTimeout = null
        }, 50)
      }
    })

    // Hook into compilation start
    compiler.hooks.compile.tap('FileChangeLoggerPlugin', () => {
      if (this.pendingFiles.size > 0) {
        this.logChanges()
      }
    })

    // Hook into done (compilation complete)
    compiler.hooks.done.tap('FileChangeLoggerPlugin', (stats) => {
      // Log any remaining pending files
      if (this.pendingFiles.size > 0) {
        this.logChanges()
      }
    })
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the workspace root to silence the lockfile warning
  outputFileTracingRoot: path.join(__dirname),
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Exclude the drive-again-motors-main 2 folder from compilation
  webpack: (config, { dev, isServer }) => {
    // Add file change logger in development mode (both client and server)
    if (dev) {
      config.plugins.push(new FileChangeLoggerPlugin())
    }
    
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/drive-again-motors-main 2/**'],
      // Enable polling for better file change detection
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
  // Exclude from TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude from ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
