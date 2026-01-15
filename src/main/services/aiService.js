// AI Integration Service - Main Process Only
// Handles secure API communication with LLM providers

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.provider = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'ollama'
  }
  
  async explainConcept(context, question) {
    if (this.provider === 'ollama') {
      return this.callOllama(context, question);
    }
    return this.callOpenAI(context, question);
  }
  
  async callOpenAI(context, question) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a friendly AI tutor for teenagers (15-20 years old) learning AI concepts. Explain clearly, use examples, and encourage experimentation.'
            },
            {
              role: 'user',
              content: context ? `${context}\n\nQuestion: ${question}` : question
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        response: data.choices[0].message.content,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async callOllama(context, question) {
    try {
      const response = await fetch(`${this.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: context ? `${context}\n\nQuestion: ${question}` : question,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        response: data.response,
        provider: 'ollama'
      };
    } catch (error) {
      console.error('Ollama error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async executeCode(code, language) {
    // Safe code execution sandbox
    if (language === 'javascript') {
      return this.executeJavaScript(code);
    }
    
    return {
      success: false,
      error: `Language ${language} not supported yet`
    };
  }
  
  executeJavaScript(code) {
    try {
      const vm = require('vm');
      const sandbox = {
        console: {
          log: (...args) => args.join(' ')
        },
        result: null
      };
      
      const script = new vm.Script(`result = ${code}`);
      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: 5000 });
      
      return {
        success: true,
        output: String(sandbox.result)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AIService();
