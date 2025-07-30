import { useEffect } from 'react'
import { initializeCommandSystem } from './lib/commands'
import { logger } from './lib/logger'
import './App.css'
import MainWindow from './components/layout/MainWindow'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  // Initialize command system on app startup
  useEffect(() => {
    logger.info('🚀 Frontend application starting up')
    initializeCommandSystem()
    logger.debug('Command system initialized')

    // Example of logging with context
    logger.info('App environment', {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
    })
  }, [])

  return (
    <ThemeProvider>
      <MainWindow />
    </ThemeProvider>
  )
}

export default App
