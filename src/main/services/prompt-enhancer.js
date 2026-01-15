import os
import sys
import subprocess
import time
from pathlib import Path

def start_prompt_enhancer():
    """Start the Prompt Enhancer FastAPI service."""
    service_dir = Path(__file__).parent.parent / "backend-services" / "prompt-enhancer"
    
    if not service_dir.exists():
        print(f"[PROMPT_ENHANCER] Service directory not found: {service_dir}")
        return None
    
    # Check if Python and FastAPI are available
    try:
        result = subprocess.run([sys.executable, "-c", "import fastapi"], capture_output=True)
        if result.returncode != 0:
            print("[PROMPT_ENHANCER] FastAPI not installed. Installing...")
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", 
                          str(service_dir / "requirements.txt")])
    except Exception as e:
        print(f"[PROMPT_ENHANCER] Failed to check/install dependencies: {e}")
        return None
    
    # Start the service
    try:
        proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"],
            cwd=str(service_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={**os.environ, "PYTHONUNBUFFERED": "1"}
        )
        
        print("[PROMPT_ENHANCER] Started on http://127.0.0.1:8001")
        
        # Wait a moment for startup
        time.sleep(1)
        
        # Check if process is still running
        if proc.poll() is not None:
            stdout, stderr = proc.communicate()
            print(f"[PROMPT_ENHANCER] Failed to start: {stderr.decode()}")
            return None
        
        return proc
    except Exception as e:
        print(f"[PROMPT_ENHANCER] Failed to start service: {e}")
        return None

def stop_prompt_enhancer(process):
    """Stop the Prompt Enhancer service."""
    if process:
        try:
            process.terminate()
            process.wait(timeout=5)
            print("[PROMPT_ENHANCER] Stopped")
        except subprocess.TimeoutExpired:
            process.kill()
            print("[PROMPT_ENHANCER] Force killed")

module.exports = {
    startPromptEnhancer: start_prompt_enhancer,
    stopPromptEnhancer: stop_prompt_enhancer
}
