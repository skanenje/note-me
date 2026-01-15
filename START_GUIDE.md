# Starting Note-Me - Quick Reference

## One-Command Startup

```bash
npm start
```

That's it! This single command:
1. ✅ Builds Rust backend (Axum server)
2. ✅ Builds frontend (Vite + Svelte bundle)
3. ✅ Starts Python Prompt Enhancer service automatically
4. ✅ Launches Electron app
5. ✅ Opens your learning platform

**All services start automatically - no separate terminals needed!**

---

## Development Mode (With Hot Reload)

```bash
npm run dev
```

Use this during development for:
- ✅ Hot module reloading (HMR)
- ✅ Live CSS updates
- ✅ Faster iteration
- ✅ Debug logging

Starts:
- Vite dev server on http://localhost:5173
- Rust backend (port 3001)
- Python service (port 8001)
- Electron app with dev tools

---

## Build for Production

```bash
npm run build
```

Creates production-ready bundle in `dist/`

---

## Package for Distribution

```bash
npm run package
```

Creates distributable app (dmg, exe, appImage depending on OS)

---

## What Happens When You Run `npm start`

```
npm start
  ↓
Build Rust Backend (backend/src/main.rs)
  ├─ Compiles to: backend/target/release/wax-space-server
  └─ Port: 3001
  ↓
Build Frontend (Svelte + Vite)
  ├─ Bundles src/renderer/**
  ├─ Output: dist/
  └─ Ready for Electron
  ↓
Start Electron
  ├─ Loads dist/index.html
  ├─ Starts Rust backend (port 3001)
  ├─ Starts Python service (port 8001)
  └─ Opens window with app
  ↓
Python Service Auto-Starts
  ├─ Loads frameworks
  ├─ Initializes FastAPI
  ├─ Listens on port 8001
  └─ Ready for enhancement requests
```

---

## Service Ports

| Service | Port | Status |
|---------|------|--------|
| Electron App | N/A | Main window |
| Rust Backend | 3001 | Auto-starts |
| Python Enhancer | 8001 | Auto-starts |

---

## Troubleshooting

### "cargo not found"
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### "Python not found"
```bash
# Check Python
python --version  # Should be 3.8+

# Install dependencies
cd backend-services/prompt-enhancer
pip install -r requirements.txt
```

### Port already in use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Build hangs
```bash
# Clear build cache
cd backend && cargo clean && cd ..
npm run build-backend
```

---

## What's Different

### Before
- `npm run dev` - Dev with hot reload
- Manual backend start required
- Separate terminal for Python service
- Complex setup

### Now
- `npm start` - Production ready app
- All services bundled and auto-started
- Single command launch
- Everything built-in

---

## Environment Variables

### Optional: Gemini API (For enhanced Prompt Enhancer)

```bash
cp backend-services/prompt-enhancer/.env.example backend-services/prompt-enhancer/.env
nano backend-services/prompt-enhancer/.env
# Add: GEMINI_API_KEY=your_key_here
```

---

## File Structure

```
note-me/
├── src/
│   ├── main/          # Electron main process
│   └── renderer/      # Svelte frontend
├── backend/           # Rust backend
├── backend-services/
│   └── prompt-enhancer/  # Python service
├── dist/              # Production build
├── package.json       # npm scripts
└── vite.config.mjs    # Vite config
```

---

## Development Workflow

### During Active Development
```bash
# Terminal 1: Live development
npm run dev

# Make changes → Auto hot-reload
# Test in real-time → Instant feedback
```

### For Production Release
```bash
# Build everything
npm start

# App launches fully built and ready
# All services integrated and running
```

---

## Common Commands Quick Reference

| Command | Purpose |
|---------|---------|
| `npm start` | Start production-ready app |
| `npm run dev` | Start dev with hot reload |
| `npm run build` | Build frontend only |
| `npm run build-backend` | Build Rust backend only |
| `npm run package` | Create distributable |

---

## Services Architecture

```
┌─ Single Command: npm start ────────────────┐
│                                            │
│  ✅ Rust Backend (3001)                   │
│     ├─ Tools API                          │
│     ├─ Sessions Management                │
│     └─ Activity Tracking                  │
│                                            │
│  ✅ Python Service (8001)                 │
│     ├─ Framework Loading                  │
│     ├─ Prompt Enhancement                 │
│     └─ Quality Metrics                    │
│                                            │
│  ✅ Electron Frontend                     │
│     ├─ Learning Tracks                    │
│     ├─ Notes Editor                       │
│     ├─ AI Tools Browser                   │
│     └─ Prompt Enhancer UI                 │
│                                            │
└────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Install dependencies: `npm install` + `pip install -r backend-services/prompt-enhancer/requirements.txt`
2. ✅ Start app: `npm start`
3. ✅ Use features:
   - Learning Tracks for study
   - Notes for writing
   - Prompt Enhancer for optimization
   - AI Tools for ChatGPT/Claude access

---

**Ready to launch? Just run `npm start`! 🚀**

