// Seed script for Note-Me Curriculum
const { v4: uuidv4 } = require('uuid');

module.exports = function seedCurriculum(db) {
  const now = Date.now();

  // 1. Prompt Engineering 101
  const checkPE = db.prepare("SELECT COUNT(*) as count FROM lessons WHERE title = 'Prompt Engineering 101'").get();
  if (checkPE.count === 0) {
    const lessonId = uuidv4();
    
    db.prepare(`
      INSERT INTO lessons (id, title, description, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(lessonId, 'Prompt Engineering 101', 'Learn how to communicate effectively with AI systems. Master the art of crafting prompts that get you the results you want.', 1, now, now);
    
    // Block 1: Introduction
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), lessonId, 'text',
      '# Welcome to Prompt Engineering!\n\nA **prompt** is how you communicate your intent to an AI system. Think of it like giving instructions to a really smart assistant who takes everything literally.\n\nThe better your prompt, the better the AI\'s response.',
      null, 1, now, now
    );
    
    // Block 2: First playground
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), lessonId, 'playground',
      'Explain what machine learning is to a 10-year-old',
      'prompt', 2, now, now
    );
    
    // Block 3: Key principles
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), lessonId, 'text',
      '## Key Principles\n\n1. **Be Specific**: Vague prompts get vague answers\n2. **Give Context**: Help the AI understand what you need\n3. **Set Constraints**: Specify format, length, or style\n4. **Iterate**: Refine your prompt based on results',
      null, 3, now, now
    );
    
    // Block 4: Code playground
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), lessonId, 'code',
      '// Try this: Create a function that generates a creative prompt\nfunction generatePrompt(topic, audience) {\n  return `Explain ${topic} to ${audience} using simple examples`;\n}\n\ngeneratePrompt("neural networks", "a high school student")',
      'javascript', 4, now, now
    );
    
    console.log('✅ Seeded: Prompt Engineering 101');
  }

  // 2. RAG & Context Windows 101 (Expanded)
  const checkRAG = db.prepare("SELECT COUNT(*) as count FROM lessons WHERE title = 'RAG & Context Windows 101'").get();
  if (checkRAG.count === 0) {
    const ragLessonId = uuidv4();
    
    db.prepare(`
      INSERT INTO lessons (id, title, description, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ragLessonId, 'RAG & Context Windows 101', 'Learn how Retrieval-Augmented Generation bridges the gap between static LLMs and dynamic, search-enhanced context retrieval.', 2, now, now);

    // Block 1: RAG Intro Text
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), ragLessonId, 'text',
      '# Introduction to RAG\n\n**Retrieval-Augmented Generation (RAG)** is a technique where an LLM references an external knowledge base before generating a response.\n\n### The RAG Pipeline:\n1. **Retrieve**: The system searches an index (usually a vector database) for snippets relevant to the user\'s query.\n2. **Augment**: The system inserts those snippets directly into the prompt context window.\n3. **Generate**: The LLM synthesizes a final, grounded answer using the retrieved context.',
      null, 1, now, now
    );

    // Block 2: RAG Quiz
    const quiz1 = {
      question: "What is the primary motivation for using RAG instead of simply feeding all files directly to the model's context window?",
      options: [
        "To bypass token window size/cost limits and focus the model on relevant snippets",
        "To speed up the model's native inference generation speed",
        "To change the pre-trained weights of the LLM core neural net",
        "To enable offline storage of chat history"
      ],
      correctAnswerIndex: 0,
      explanation: "While context windows have grown larger, loading massive amounts of raw data is highly expensive, introduces latency, and can lead to the model 'getting lost in the middle' of long inputs. RAG optimizes this by pre-filtering relevant content."
    };
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), ragLessonId, 'quiz', JSON.stringify(quiz1), null, 2, now, now
    );

    // Block 3: RAG Prompt Playground
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), ragLessonId, 'playground',
      'You are a RAG Router. Rephrase the following request into a search query optimized for a semantic vector index:\n\nUser: "How do I upgrade my team\'s billing subscription plan?"',
      'prompt', 3, now, now
    );

    // Block 4: Embeddings & Vector Databases
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), ragLessonId, 'text',
      '## Embeddings & Vector Databases\n\nTo retrieve relevant context, we must convert text into mathematical arrays called **Embeddings**. Models like `text-embedding-3-small` turn sentences into dense vectors (e.g. 1536 dimensions).\n\nA **Vector Database** (like Pinecone or ChromaDB) stores these vectors and uses algorithms like Cosine Similarity to find documents that are *semantically* related to your query, not just exact keyword matches.',
      null, 4, now, now
    );

    // Block 5: Chunking Quiz
    const quiz2 = {
      question: "When embedding a massive 500-page PDF book into a Vector DB, what is the best strategy?",
      options: [
        "Embed the entire book as a single 1536-dimensional vector.",
        "Split the book into overlapping 'chunks' (e.g., 500 tokens each) and embed each chunk individually.",
        "Only embed the title and author name.",
        "Translate the book into mathematical equations first."
      ],
      correctAnswerIndex: 1,
      explanation: "Embedding the entire book into one vector dilutes its semantic meaning into an unsearchable blur. Splitting the document into semantic chunks allows the Vector DB to precisely retrieve the exact paragraph or section containing the answer."
    };
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), ragLessonId, 'quiz', JSON.stringify(quiz2), null, 5, now, now
    );

    // Block 6: RAG Javascript Code Block (Semantic Search Mock)
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), ragLessonId, 'code',
      '// Simulated Vector Embedding \nfunction getEmbedding(text) {\n  // In reality, this calls an API like OpenAI Embeddings\n  return text.length % 10; // Dummy dimension\n}\n\n// Simulate Cosine Similarity Search\nfunction semanticSearch(query, database) {\n  const queryVec = getEmbedding(query);\n  // Find exact vector match for simplicity\n  return database.filter(doc => getEmbedding(doc.text) === queryVec);\n}\n\nconst db = [\n  { text: "Apples are delicious red fruits." },\n  { text: "Dogs are loyal pets." },\n  { text: "Bananas are yellow." }\n];\n\nconsole.log("Search Results:", semanticSearch("fruit", db));',
      'javascript', 6, now, now
    );

    console.log('✅ Seeded: RAG & Context Windows 101');
  }

  // 3. Agents & Tool Use 101 (New Track)
  const checkAgents = db.prepare("SELECT COUNT(*) as count FROM lessons WHERE title = 'Agents & Tool Use 101'").get();
  if (checkAgents.count === 0) {
    const agentsLessonId = uuidv4();
    
    db.prepare(`
      INSERT INTO lessons (id, title, description, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(agentsLessonId, 'Agents & Tool Use 101', 'Discover how to empower LLMs to take action by integrating tools, APIs, and the ReAct (Reasoning and Acting) framework.', 3, now, now);

    // Block 1: Intro to Agents
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), agentsLessonId, 'text',
      '# Introduction to AI Agents\n\nAn **Agent** is an AI system that is given an objective and a set of **Tools** (like a calculator, web search, or API access). Instead of just generating text, it actively decides *when* and *how* to use those tools to solve the problem.\n\n### The ReAct Loop\nThe most common agent framework is **ReAct** (Reasoning and Acting):\n1. **Thought**: The model thinks about what to do next.\n2. **Action**: The model requests to use a tool.\n3. **Observation**: The system runs the tool and returns the result to the model.\n\nThis loop repeats until the model reaches a final answer!',
      null, 1, now, now
    );

    // Block 2: Agent Quiz
    const quizAgent = {
      question: "Which of the following scenarios describes an Agentic workflow rather than a standard LLM completion?",
      options: [
        "Asking an LLM to write a poem about the ocean.",
        "Providing an LLM with a 10-page document and asking it to summarize it.",
        "Giving an LLM access to a weather API and asking it: 'Should I wear a jacket in Seattle today?'. The LLM queries the API, reads the forecast, and answers.",
        "Translating a paragraph from English to French."
      ],
      correctAnswerIndex: 2,
      explanation: "Agents are defined by their ability to take autonomous actions (like querying the weather API) and observing the results to inform their final generation. The other options are static text-in, text-out operations."
    };
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), agentsLessonId, 'quiz', JSON.stringify(quizAgent), null, 2, now, now
    );

    // Block 3: ReAct Loop Code Playground
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), agentsLessonId, 'code',
      '// Pseudo-code for an Agent ReAct Loop\nasync function agentLoop(userQuery, tools) {\n  let prompt = `Solve this: ${userQuery}. Available tools: ${tools.map(t => t.name)}`;\n  \n  for (let i = 0; i < 5; i++) { // Max 5 iterations\n    const response = await simulateLLMCall(prompt);\n    \n    if (response.includes("FINAL ANSWER")) {\n      return response;\n    }\n    \n    if (response.includes("CALL_TOOL")) {\n      const toolResult = "Observed result from tool execution.";\n      prompt += `\\nObservation: ${toolResult}`;\n      console.log(`Step ${i+1}: Called tool.`);\n    }\n  }\n}\n\n// Run standard Node.js logic\nconsole.log("Agent loop initialized.");',
      'javascript', 3, now, now
    );

    // Block 4: Playground
    db.prepare(`INSERT INTO learning_blocks (id, lesson_id, type, content, language, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), agentsLessonId, 'playground',
      'You are a smart agent. You have access to a tool called [get_stock_price].\n\nUser: "What is the current stock price of Apple?"\n\nWrite the exact Thought and Action you would output to retrieve this data:',
      'prompt', 4, now, now
    );

    console.log('✅ Seeded: Agents & Tool Use 101');
  }
};
