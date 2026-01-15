# Note-Me LMS - Interactive AI Learning Platform

A desktop learning management system built with Electron, Svelte, and SQLite. Designed for 15-20 year olds to learn AI concepts through interactive, hands-on experiences.

## 🎯 Vision

Transform from a Notion-like note-taking app into an **Interactive LMS** that teaches AI concepts through:
- **Executable Learning Blocks** - Run code and prompts directly in lessons
- **AI Tutoring** - Chat with AI to get explanations and guidance
- **Progress Tracking** - Visual progress through learning tracks
- **Local-First** - All data stored locally with SQLite

## 🏗️ Architecture

### Main Process (`src/main/`)
- **index.js** - Application entry point
- **window.js** - Window management
- **database/** - SQLite database layer
  - `index.js` - DatabaseManager class
  - `schema.js` - Core schema initialization
  - `lms-schema.js` - LMS-specific tables
  - `lms-methods.js` - LMS database operations
  - `seed.js` - Initial content seeding
- **ipc/** - IPC handlers (separated by domain)
  - `documents.js` - Document operations
  - `blocks.js` - Block operations
  - `mutations.js` - Mutation log operations
  - `lessons.js` - Lesson and progress tracking
  - `ai.js` - AI integration handlers
- **services/** - Business logic
  - `aiService.js` - AI provider integration (OpenAI/Ollama)

### Preload (`src/preload/`)
- **index.js** - Secure context bridge API

### Renderer (`src/renderer/`)
- **main.js** - Svelte app entry
- **App.svelte** - Root component with navigation
- **components/** - UI components
  - `Navigation.svelte` - Main navigation
  - `LessonList.svelte` - Learning tracks overview
  - `LessonView.svelte` - Individual lesson display
  - `PlaygroundBlock.svelte` - Interactive AI/code playground
  - `CodeBlock.svelte` - Executable code snippets
  - `Sidebar.svelte` - Document list (notes mode)
  - `Editor.svelte` - Document editor (notes mode)
  - `MutationLog.svelte` - Activity tracking
- **stores/** - Svelte stores (state management)
  - `documents.js` - Document state
  - `mutations.js` - Mutation state
- **styles/** - CSS modules
  - `global.css` - Global styles

## 📊 Database Schema

### LMS Tables

**lessons** - Curriculum structure
```sql
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**learning_blocks** - Executable content
```sql
CREATE TABLE learning_blocks (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('text', 'prompt', 'code', 'playground', 'quiz')),
  content TEXT NOT NULL,
  language TEXT,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**user_progress** - State tracking
```sql
CREATE TABLE user_progress (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  block_id TEXT,
  status TEXT CHECK(status IN ('locked', 'started', 'completed')),
  last_interaction INTEGER NOT NULL
);
```

**code_runs** - Execution history
```sql
CREATE TABLE code_runs (
  id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  error TEXT,
  created_at INTEGER NOT NULL
);
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys (optional - for AI features)
# AI_PROVIDER=openai
# OPENAI_API_KEY=your_key_here
```

### Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Package for distribution
npm run package
```

## 🤖 AI Integration

### Supported Providers

1. **OpenAI** (GPT-4, GPT-3.5)
   - Set `AI_PROVIDER=openai`
   - Add `OPENAI_API_KEY` to `.env`

2. **Ollama** (Local AI)
   - Install Ollama: https://ollama.ai
   - Set `AI_PROVIDER=ollama`
   - Set `OLLAMA_HOST=http://localhost:11434`

### Security

- API keys stored in `.env` (never in renderer)
- Main process handles all AI communication
- Renderer communicates via secure IPC bridge

## 📚 Initial Content

The app seeds with **"Prompt Engineering 101"** lesson including:
- Introduction to prompts
- Interactive AI playground
- Key principles of prompt engineering
- Code examples

## 🎨 Features

### Learning Mode
- **Interactive Playgrounds** - Execute prompts and code
- **AI Tutoring** - Ask questions, get explanations
- **Progress Tracking** - Visual completion status
- **Execution History** - Review past attempts

### Notes Mode
- **Documents & Blocks** - Freeform note-taking
- **Mutation Log** - Track all changes
- **Local-First** - All data stored locally

## 🔒 Security

- Context isolation enabled
- No `nodeIntegration` in renderer
- API keys never exposed to renderer
- Sandboxed code execution (VM module)

## 🛠️ Tech Stack

- **Electron** - Desktop framework
- **Svelte 4** - Reactive UI framework
- **Vite** - Build tool and dev server
- **better-sqlite3** - SQLite database
- **UUID** - Unique ID generation

## 📈 Roadmap

- [ ] Python code execution (subprocess)
- [ ] Quiz blocks with validation
- [ ] Multi-user progress (profiles)
- [ ] Export lessons as markdown
- [ ] Custom lesson creation UI
- [ ] Offline AI with Ollama
- [ ] Mobile companion app (sync)

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## 📄 License

ISC

