# Note Me - Writing App

A modular Electron + Svelte writing application with local-first architecture and mutation tracking.

## Architecture

### Main Process (`src/main/`)
- **index.js** - Application entry point
- **window.js** - Window management
- **database/** - SQLite database layer
  - `index.js` - DatabaseManager class
  - `schema.js` - Database schema initialization
- **ipc/** - IPC handlers (separated by domain)
  - `documents.js` - Document operations
  - `blocks.js` - Block operations
  - `mutations.js` - Mutation log operations

### Preload (`src/preload/`)
- **index.js** - Context bridge API exposure

### Renderer (`src/renderer/`)
- **main.js** - Svelte app entry
- **App.svelte** - Root component
- **components/** - UI components
  - `Sidebar.svelte` - Document list
  - `Editor.svelte` - Document editor
  - `Block.svelte` - Block component
  - `MutationLog.svelte` - Mutation tracking panel
- **stores/** - Svelte stores (state management)
  - `documents.js` - Document state
  - `mutations.js` - Mutation state
- **styles/** - CSS modules
  - `global.css` - Global styles

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Package for distribution
npm run package
```

## Features

- Local-first SQLite database
- Mutation tracking for sync capabilities
- Modular architecture with separation of concerns
- Svelte reactive UI
- Hot reload in development

## Tech Stack

- **Electron** - Desktop framework
- **Svelte** - Reactive UI framework
- **Vite** - Build tool and dev server
- **better-sqlite3** - SQLite database
- **UUID** - Unique ID generation
