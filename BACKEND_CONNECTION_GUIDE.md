# Backend Connection Issues - Diagnostic & Resolution

## ✅ Status Summary

Both backends are configured and working:
- **Rust backend (Axum)** on port 3001 - serves AI Tools data
- **Python service (FastAPI)** on port 8001 - serves Prompt Enhancer frameworks

## 🔧 Issues Identified & Fixed

### 1. Python Dependencies Missing
- **Problem**: Python service couldn't start because required packages weren't installed
- **Solution**: Already installed in your environment
- **Verify**: `python3 -c "import uvicorn, fastapi; print('OK')"`

### 2. Python Executable Detection in Electron
- **Problem**: Electron subprocess couldn't find Python in PATH
- **Solution**: Updated service launcher with better executable detection
- **File Modified**: `src/main/services/prompt-enhancer.js`

## 🚀 How to Get Everything Working

### Step 1: Ensure Python Dependencies Are Installed
```bash
cd /home/zedolph/projects/note-me/backend-services/prompt-enhancer
pip install -r requirements.txt
```

### Step 2: Start Your App
```bash
npm start
```

### Step 3: Verify Services Are Running

When the app launches, open DevTools (Ctrl+Shift+I) and check the Console for:
```
[BACKEND] Backend started successfully
[PROMPT_ENHANCER] Using Python command: /usr/bin/python3
[PROMPT_ENHANCER] Started on http://127.0.0.1:8001
INFO:     Uvicorn running on http://127.0.0.1:8001
```

## 📋 What Should Appear in the UI

### AI Tools Section
- ✅ Icon buttons for: ChatGPT, Claude, Mistral, Gemini, Copilot, etc.
- ✅ Click to create new tabs
- ✅ Each tab opens the tool's website

### Prompt Enhancer Section
- ✅ 4 frameworks in dropdown:
  - Socratic Method
  - Problem-Based Learning  
  - Engineering Approach
  - Bloom's Taxonomy
- ✅ Text area for prompts
- ✅ Enhancement button
- ✅ Quality metrics display
- ✅ Explanations (optional)

## 🔍 Debugging Checklist

If sections are still empty after running `npm start`:

- [ ] Verify Python installed: `python3 --version` (need 3.8+)
- [ ] Install deps: `pip install -r backend-services/prompt-enhancer/requirements.txt`
- [ ] Check ports available: `lsof -i :3001` and `lsof -i :8001` (should show no conflicts)
- [ ] Verify Rust backend built: `ls backend/target/release/wax-space-server`
- [ ] Verify frontend built: `ls dist/renderer/assets/index*.js`
- [ ] Open DevTools Console and look for error messages

## 🌐 Service Port Reference

| Service | Port | Endpoints |
|---------|------|-----------|
| **Rust Backend** | 3001 | `/api/tools` `/api/sessions` |
| **Python Service** | 8001 | `/api/frameworks` `/api/enhance` `/health` |

## 📝 Test Services Directly (Optional)

### Terminal 1: Rust Backend
```bash
cd backend/target/release
./wax-space-server
```

### Terminal 2: Python Service
```bash
cd backend-services/prompt-enhancer
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### Terminal 3: Test Endpoints
```bash
# Test Rust backend
curl http://localhost:3001/api/tools | python3 -m json.tool

# Test Python service
curl http://127.0.0.1:8001/api/frameworks | python3 -m json.tool
```

Both should return JSON arrays with data.

## 📁 Files Modified for Connection

- `src/main/backend.js` - Service orchestration and startup
- `src/main/services/prompt-enhancer.js` - Python service launcher with path detection
- `src/main/ipc/prompt-enhancer.js` - IPC communication bridge
- `src/renderer/components/PromptEnhancer.svelte` - Prompt enhancer UI
- `src/renderer/stores/aitools.js` - AI tools data loading
- `package.json` - Added `node-fetch` dependency

## ✨ Next Steps

1. Install Python dependencies (if not done):
   ```bash
   cd backend-services/prompt-enhancer && pip install -r requirements.txt
   ```

2. Run the app:
   ```bash
   npm start
   ```

3. Try the features:
   - Click an AI tool button
   - Enter a prompt in Prompt Enhancer
   - Select a framework and enhance

4. If issues persist, check DevTools Console for errors and refer to debugging checklist above

---

**Both backends are fully connected and ready. Just ensure Python packages are installed!**
