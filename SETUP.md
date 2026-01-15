# Setup Guide - Note-Me LMS

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure AI Provider (Optional)

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` and choose your AI provider:

#### Option A: OpenAI (Cloud)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

#### Option B: Ollama (Local - Free)
```bash
# Install Ollama first
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Configure .env
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
```

### 3. Run the App

**Development Mode** (with hot reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm run build
npm start
```

## Features Overview

### 🎓 Learning Tracks
- Interactive lessons with executable code blocks
- AI-powered explanations and tutoring
- Progress tracking through lessons
- Hands-on playgrounds for experimentation

### 📝 Notes Mode
- Freeform document creation
- Block-based content organization
- Full mutation history

### 🔄 Activity Log
- Track all changes and interactions
- Sync status monitoring
- Execution history

## Initial Content

The app automatically seeds with **"Prompt Engineering 101"** lesson on first launch, including:
- Introduction to AI prompts
- Interactive playground
- Code examples
- Best practices

## Troubleshooting

### AI Features Not Working

**Check 1: Environment Variables**
```bash
# Make sure .env exists
ls -la .env

# Verify it's loaded
echo $OPENAI_API_KEY  # or check in app
```

**Check 2: Ollama Running** (if using local AI)
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve
```

### Database Issues

The database is stored at:
- **Linux**: `~/.config/note-me/writing-app.db`
- **macOS**: `~/Library/Application Support/note-me/writing-app.db`
- **Windows**: `%APPDATA%/note-me/writing-app.db`

To reset:
```bash
# Stop the app, then delete the database
rm ~/.config/note-me/writing-app.db  # Linux
# Restart the app - it will recreate and reseed
```

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild native modules
npx electron-rebuild
```

## Development Tips

### Hot Reload
The dev server watches for changes in `src/renderer/` and automatically reloads the UI.

### Database Inspection
```bash
# Install sqlite3 CLI
sudo apt install sqlite3  # Linux
brew install sqlite3      # macOS

# Open database
sqlite3 ~/.config/note-me/writing-app.db

# View tables
.tables

# Query lessons
SELECT * FROM lessons;
```

### Adding New Lessons

Edit `src/main/database/seed.js` to add more initial content.

## Next Steps

1. Complete "Prompt Engineering 101"
2. Experiment with the playground
3. Create your own notes
4. Try different AI providers
5. Build custom lessons (coming soon!)

## Support

- Check the README.md for architecture details
- Review code comments for implementation notes
- Open issues for bugs or feature requests
