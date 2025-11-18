/**
 * node-pty wrapper with graceful fallback for Windows without build tools
 */

const { spawn: nodeSpawn } = require('child_process')
const { EventEmitter } = require('events')
const os = require('os')

let ptyInstance = null
let hasWarningShown = false
let useNativePty = true

function showWarningOnce() {
  if (!hasWarningShown) {
    hasWarningShown = true
    console.warn('⚠️  node-pty native module not available - using child_process fallback')
    console.warn('   Terminal functionality will work with basic features')
    console.warn('   To get full terminal features, install Visual Studio Build Tools')
  }
}

// Simple fallback terminal implementation using child_process
class FallbackTerminal extends EventEmitter {
  constructor(file, args, options = {}) {
    super()
    
    this.cols = options.cols || 80
    this.rows = options.rows || 24
    this.killed = false
    
    // Spawn the process
    this.process = nodeSpawn(file, args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    this.pid = this.process.pid
    
    // Forward stdout data
    this.process.stdout.on('data', (data) => {
      if (!this.killed) {
        this.emit('data', data)
      }
    })
    
    // Forward stderr data
    this.process.stderr.on('data', (data) => {
      if (!this.killed) {
        this.emit('data', data)
      }
    })
    
    // Handle process exit
    this.process.on('exit', (code, signal) => {
      this.killed = true
      this.emit('exit', code, signal)
    })
    
    // Handle process errors
    this.process.on('error', (err) => {
      this.emit('error', err)
    })
  }
  
  write(data) {
    if (!this.killed && this.process.stdin) {
      this.process.stdin.write(data)
    }
  }
  
  resize(cols, rows) {
    this.cols = cols
    this.rows = rows
    // Note: Basic fallback doesn't support real terminal resizing
  }
  
  kill(signal = 'SIGTERM') {
    if (!this.killed) {
      this.killed = true
      this.process.kill(signal)
    }
  }
}

function getPty() {
  if (ptyInstance) {
    return ptyInstance
  }

  try {
    ptyInstance = require('node-pty')
    console.log('✓ node-pty native module loaded successfully')
    return ptyInstance
  } catch (error) {
    showWarningOnce()
    useNativePty = false
    return null
  }
}

module.exports = {
  spawn: function(file, args = [], options = {}) {
    if (useNativePty) {
      try {
        const pty = getPty()
        if (pty) {
          return pty.spawn(file, args, options)
        }
      } catch (error) {
        console.warn('node-pty spawn failed, using fallback')
        useNativePty = false
      }
    }
    
    // Use fallback
    showWarningOnce()
    return new FallbackTerminal(file, args, options)
  },
  
  fork: function(...args) {
    return this.spawn(...args)
  },
  
  createTerminal: function(...args) {
    return this.spawn(...args)
  },
  
  open: function(options) {
    const pty = getPty()
    if (pty && useNativePty) {
      try {
        return pty.open(options)
      } catch (error) {
        showWarningOnce()
        throw new Error('Terminal open not supported in fallback mode')
      }
    }
    throw new Error('Terminal open not supported in fallback mode')
  }
}
