# Note-Me - Integrated Learning & AI Tools Platform

A desktop application combining note-taking, learning management, and AI tools browser functionality. Built with Electron, Svelte, and SQLite.

## 🎯 Features

### 📚 Learning Tracks
- Interactive lessons with executable code blocks
- Progress tracking through learning materials
- JavaScript code playground for hands-on practice

### 📝 My Notes
- Notion-like note-taking interface
- Block-based document editing
- Local-first storage with SQLite
- Mutation tracking for all changes

### 🤖 AI Tools Browser
- Integrated browser for multiple AI platforms
- Session management for different AI tools
- Tabbed interface for easy switching
- Persistent sessions across app restarts

**Supported AI Tools:**
- ChatGPT
- Claude
- Gemini
- Copilot
- DeepSeek
- Perplexity
- Grok
- NotebookLM
- v0
- Mistral
- And more...

## 🏗️ Architecture

### Frontend (Electron + Svelte)
- **Main Process** (`src/main/`)
  - `index.js` - Application entry point
  - `window.js` - Window management
  - `tabs.js` - BrowserView tab management
  - `database/` - SQLite database layer
  - `ipc/` - IPC handlers for documents, blocks, lessons

- **Renderer** (`src/renderer/`)
  - Svelte components for UI
  - Stores for state management
  - Three main views: Learning, Notes, AI Tools

### Backend (Node.js + IPC)
- Direct SQLite integration using `better-sqlite3` via IPC handlers
- No external server needed; fully bundled within Electron Main Process
- Manages tool definitions, learning tracks, documents, and session persistence

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run in development mode
npm run dev

# This will:
# 1. Start Vite dev server
# 2. Launch Electron app
```

### Production Build

```bash
# Build frontend
npm run build

# Run production app
npm start

# Package for distribution
npm run package
```

## 📊 Database Schema

### SQLite (Main App)
- **documents** - User notes and pages
- **blocks** - Content blocks within documents
- **lessons** - Learning curriculum
- **learning_blocks** - Lesson content
- **user_progress** - Learning progress tracking

### SQLite (Rust Backend)
- **tools** - AI platform definitions
- **tool_sessions** - Active and historical sessions

## 🔒 Security

- Context isolation enabled
- No `nodeIntegration` in renderer
- Sandboxed BrowserViews for AI tools
- Each AI tool session runs in isolated partition

## 🛠️ Tech Stack

- **Electron** - Desktop framework
- **Svelte 4** - Reactive UI framework
- **Vite** - Build tool and dev server
- **better-sqlite3** - SQLite database
- **Rust + Axum** - Backend API server
- **Tailwind CSS** - Styling

## 📁 Project Structure

```
note-me/
├── src/
│   ├── main/           # Electron main process
│   │   ├── database/   # SQLite layer
│   │   ├── ipc/        # IPC handlers
│   │   └── tabs.js     # BrowserView management
│   ├── preload/        # Preload scripts
│   └── renderer/       # Svelte frontend
│       ├── components/ # UI components
│       └── stores/     # State management
└── static/             # AI tool icons

```

## 🎨 Key Components

### AIToolsView.svelte
Main component for the AI tools browser, displays tool bookmarks and manages tabs.

### Toolbar
Shows available AI tools and active sessions with tab switching.

### PlaygroundBlock
Interactive code execution for learning (JavaScript only, no external AI calls).

## 🔄 Changes from Original Projects

### From wax-spes:
- ✅ Integrated native Node backend via IPC for AI tool management
- ✅ BrowserView-based tab system
- ✅ Session persistence
- ✅ Tool icons and definitions

### From note-me:
- ✅ Note-taking functionality
- ✅ Learning management system


## 📈 Roadmap

- [ ] Sync sessions across devices
- [ ] Custom tool additions via UI
- [ ] Export notes as markdown
- [ ] Python code execution
- [ ] Quiz blocks with validation
- [ ] Multi-user profiles

## 🤝 Contributing

This is a combined learning and productivity project. Feel free to fork and experiment!

## 📄 License

ISC
