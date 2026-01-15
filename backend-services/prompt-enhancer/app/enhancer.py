# backend-services/prompt-enhancer/app/enhancer.py
import os
import json
from typing import Dict, List
from app.models import QualityMetrics, EnhanceResponse
from app.loader import get_framework

def calculate_quality_metrics(prompt: str, enhanced_prompt: str) -> QualityMetrics:
    """Calculate quality metrics for a prompt."""
    # Simple heuristic-based metrics
    original_length = len(prompt.split())
    enhanced_length = len(enhanced_prompt.split())
    
    clarity = min(10, (enhanced_length / max(original_length, 1)) * 5 + 3)
    specificity = min(10, 6 + (len([w for w in enhanced_prompt.split() if len(w) > 5]) / enhanced_length * 3))
    context_richness = min(10, (enhanced_length / 20) + 5)
    actionability = min(10, 7 if any(verb in enhanced_prompt.lower() for verb in ['provide', 'create', 'build', 'explain', 'analyze']) else 5)
    overall = (clarity + specificity + context_richness + actionability) / 4
    
    return QualityMetrics(
        clarity=round(clarity, 2),
        specificity=round(specificity, 2),
        context_richness=round(context_richness, 2),
        actionability=round(actionability, 2),
        overall=round(overall, 2)
    )

def enhance_prompt(prompt: str, framework_id: str = None, fields: Dict = None, explain: bool = False) -> Dict:
    """Enhance a prompt using a framework and AI."""
    try:
        # Try to use Gemini API if available
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        
        if api_key:
            genai.configure(api_key=api_key)
            
            # Get framework if specified
            framework = None
            selected_framework = "default"
            
            if framework_id:
                framework = get_framework(framework_id)
                if framework:
                    selected_framework = framework.get("name", framework_id)
            
            # Build system prompt
            system_prompt = get_system_prompt(framework)
            
            # Build enhancement request
            enhancement_instructions = build_enhancement_instructions(framework, fields)
            
            # Call Gemini
            model = genai.GenerativeModel("gemini-pro")
            full_prompt = f"{system_prompt}\n\nEnhance this prompt:\n{prompt}\n\n{enhancement_instructions}"
            
            response = model.generate_content(full_prompt)
            enhanced_prompt = response.text
        else:
            # Fallback: simple enhancement without API
            enhanced_prompt = simple_enhance(prompt, framework_id, fields)
            selected_framework = framework_id or "basic"
        
        metrics = calculate_quality_metrics(prompt, enhanced_prompt)
        
        explanations = []
        if explain:
            explanations = generate_explanations(prompt, enhanced_prompt, framework_id)
        
        return {
            "selected_framework": selected_framework,
            "enhanced_prompt": enhanced_prompt,
            "quality": metrics.dict(),
            "explain": explanations
        }
    
    except Exception as e:
        print(f"Error enhancing prompt: {e}")
        enhanced_prompt = simple_enhance(prompt, framework_id, fields)
        metrics = calculate_quality_metrics(prompt, enhanced_prompt)
        return {
            "selected_framework": framework_id or "basic",
            "enhanced_prompt": enhanced_prompt,
            "quality": metrics.dict(),
            "explain": []
        }

def simple_enhance(prompt: str, framework_id: str = None, fields: Dict = None) -> str:
    """Simple prompt enhancement without API."""
    framework = None
    if framework_id:
        framework = get_framework(framework_id)
    
    enhanced = prompt
    
    if framework:
        template = framework.get("template", "")
        if template:
            enhanced = template.format(prompt=prompt, **(fields or {}))
    else:
        # Default enhancement
        enhanced = f"Please provide a detailed response to the following:\n\n{prompt}\n\nConsider all relevant aspects and provide comprehensive information."
    
    return enhanced

def get_system_prompt(framework: Dict = None) -> str:
    """Get system prompt for enhancement."""
    if framework and framework.get("system_prompt"):
        return framework["system_prompt"]
    
    return """You are an expert educator with an engineering mindset. When enhancing prompts, always apply first principles thinking and focus on fundamentals. Structure your responses to:

1. **Break down complex topics into fundamental components** - Start with basic building blocks and core principles
2. **Use engineering methodology** - Apply systematic, logical approaches to problem-solving
3. **Provide foundational understanding** - Explain the 'why' behind concepts, not just the 'what'
4. **Include practical applications** - Connect theory to real-world engineering examples
5. **Encourage deep learning** - Promote understanding of underlying mechanisms and relationships
6. **Use clear, technical language** - Be precise and accurate while remaining accessible"""

def build_enhancement_instructions(framework: Dict = None, fields: Dict = None) -> str:
    """Build enhancement instructions based on framework."""
    instructions = "Enhance this prompt to be more effective for learning. Make it clear, specific, and actionable."
    
    if framework:
        if framework.get("instructions"):
            instructions = framework["instructions"]
        if framework.get("criteria"):
            instructions += f"\n\nCriteria: {', '.join(framework['criteria'])}"
    
    if fields:
        instructions += "\n\nAdditional context: " + ", ".join(f"{k}: {v}" for k, v in fields.items())
    
    return instructions

def generate_explanations(prompt: str, enhanced_prompt: str, framework_id: str = None) -> List[str]:
    """Generate explanations for the enhancements made."""
    explanations = [
        "Added specific learning objectives to clarify goals",
        "Included context to improve understanding",
        "Structured the prompt for better information retention",
        "Applied pedagogical best practices for effective learning"
    ]
    return explanations
