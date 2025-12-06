const fs = require('fs')
const path = require('path')

// Track file changes to show repetition counts
const changedFiles = new Map()
let batchTimeout = null
const pendingFiles = new Set()

function formatTime() {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  })
}

function logChanges() {
  if (pendingFiles.size === 0) return

  const timeStr = formatTime()
  const files = Array.from(pendingFiles)
  
  // Track and count file changes
  files.forEach(file => {
    const count = changedFiles.get(file) || 0
    changedFiles.set(file, count + 1)
  })

  // Format file paths
  const formattedFiles = files.map(file => {
    const relativePath = path.relative(process.cwd(), file)
    const displayPath = relativePath.startsWith('..') ? file : relativePath
    const repeatCount = changedFiles.get(file)
    const repeatStr = repeatCount > 1 ? ` (x${repeatCount})` : ''
    return `${displayPath}${repeatStr}`
  })

  // Log in Vite-style format
  console.log(
    `\x1b[90m${timeStr}\x1b[0m \x1b[36m[next]\x1b[0m \x1b[32mhmr update\x1b[0m \x1b[0m${formattedFiles.join(', ')}`
  )

  // Clear pending files and reset counters after delay
  pendingFiles.clear()
  setTimeout(() => {
    files.forEach(file => changedFiles.delete(file))
  }, 2000)
}

// Watch for file changes and log them
function watchFiles() {
  const watchDirs = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components'),
    path.join(__dirname, '../lib'),
    path.join(__dirname, '../middleware.ts'),
    path.join(__dirname, '../next.config.js'),
  ]

  watchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename && (eventType === 'change' || eventType === 'rename')) {
          const fullPath = path.join(dir, filename)
          
          // Only log actual file changes, not directory changes
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            pendingFiles.add(fullPath)
            
            // Batch log changes (similar to Vite)
            if (batchTimeout) {
              clearTimeout(batchTimeout)
            }
            
            batchTimeout = setTimeout(() => {
              logChanges()
              batchTimeout = null
            }, 50) // Small delay to batch rapid changes
          }
        }
      })
    }
  })
}

// Start watching
watchFiles()
console.log('\x1b[36m[next]\x1b[0m File watcher started. Watching for changes...\n')

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n\x1b[36m[next]\x1b[0m File watcher stopped.')
  process.exit(0)
})

