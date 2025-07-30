import { useEffect } from 'react'
import { initializeCommandSystem } from './lib/commands'
import './App.css'
import MainWindow from './components/layout/MainWindow'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  // Initialize command system on app startup
  useEffect(() => {
    initializeCommandSystem()
  }, [])

  return (
    <ThemeProvider>
      <MainWindow />
    </ThemeProvider>
  )
}

export default App
