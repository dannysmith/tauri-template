import { useEffect } from 'react'
import {
  initializeCommandSystem,
  executeCommand,
  useCommandContext,
} from './lib/commands'
import { useUIStore } from './store/ui-store'
import './App.css'

function App() {
  // Initialize command system on app startup
  useEffect(() => {
    initializeCommandSystem()
  }, [])

  const context = useCommandContext()
  const { sidebarVisible, commandPaletteOpen } = useUIStore()

  const handleExecuteCommand = (commandId: string) => {
    executeCommand(commandId, context)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Command System Demo</h1>

      <div className="space-y-2">
        <p>UI State:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Sidebar: {sidebarVisible ? 'Visible' : 'Hidden'}</li>
          <li>Command Palette: {commandPaletteOpen ? 'Open' : 'Closed'}</li>
        </ul>
      </div>

      <div className="space-y-2">
        <p>Available Commands:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExecuteCommand('toggle-sidebar')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Sidebar
          </button>
          <button
            onClick={() => handleExecuteCommand('toggle-command-palette')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Toggle Command Palette
          </button>
          <button
            onClick={() => handleExecuteCommand('open-preferences')}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Open Preferences
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
