// Seed script for "Prompt Engineering 101" lesson
const { v4: uuidv4 } = require('uuid');

module.exports = function seedPromptEngineering101(db) {
  const now = Date.now();

  // Check if PE 101 lesson is already seeded
  const checkPE = db.prepare("SELECT COUNT(*) as count FROM lessons WHERE title = 'Prompt Engineering 101'").get();
  if (checkPE.count === 0) {
    const lessonId = uuidv4();
    
    // Create lesson
    db.prepare(`
      INSERT INTO lessons (id, title, description, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      lessonId,
      'Prompt Engineering 101',
      'Learn how to communicate effectively with AI systems. Master the art of crafting prompts that get you the results you want.',
      1,
      now,
      now
    );
    
    // Block 1: Introduction
    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      lessonId,
      'text',
      '# Welcome to Prompt Engineering!\n\nA **prompt** is how you communicate your intent to an AI system. Think of it like giving instructions to a really smart assistant who takes everything literally.\n\nThe better your prompt, the better the AI\'s response.',
      null,
      1,
      now,
      now
    );
    
    // Block 2: First playground
    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      lessonId,
      'playground',
      'Explain what machine learning is to a 10-year-old',
      'prompt',
      2,
      now,
      now
    );
    
    // Block 3: Key principles
    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      lessonId,
      'text',
      '## Key Principles\n\n1. **Be Specific**: Vague prompts get vague answers\n2. **Give Context**: Help the AI understand what you need\n3. **Set Constraints**: Specify format, length, or style\n4. **Iterate**: Refine your prompt based on results',
      null,
      3,
      now,
      now
    );
    
    // Block 4: Code playground
    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      lessonId,
      'code',
      '// Try this: Create a function that generates a creative prompt\nfunction generatePrompt(topic, audience) {\n  return `Explain ${topic} to ${audience} using simple examples`;\n}\n\ngeneratePrompt("neural networks", "a high school student")',
      'javascript',
      4,
      now,
      now
    );
    
    console.log('✅ Seeded: Prompt Engineering 101');
  }

  // Check if RAG lesson is already seeded
  const checkRAG = db.prepare("SELECT COUNT(*) as count FROM lessons WHERE title = 'RAG & Context Windows 101'").get();
  if (checkRAG.count === 0) {
    const ragLessonId = uuidv4();
    
    // Create RAG lesson
    db.prepare(`
      INSERT INTO lessons (id, title, description, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      ragLessonId,
      'RAG & Context Windows 101',
      'Learn how Retrieval-Augmented Generation bridges the gap between static LLMs and dynamic, search-enhanced context retrieval.',
      2,
      now,
      now
    );

    // Block 1: RAG Intro Text
    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      ragLessonId,
      'text',
      '# Introduction to RAG\n\n**Retrieval-Augmented Generation (RAG)** is a technique where an LLM references an external knowledge base before generating a response.\n\n### The RAG Pipeline:\n1. **Retrieve**: The system searches an index (usually a vector database) for snippets relevant to the user\'s query.\n2. **Augment**: The system inserts those snippets directly into the prompt context window.\n3. **Generate**: The LLM synthesizes a final, grounded answer using the retrieved context.',
      null,
      1,
      now,
      now
    );

    // Block 2: RAG Quiz
    const quizContent = {
      question: "What is the primary motivation for using RAG instead of simply feeding all files directly to the model's context window?",
      options: [
        "To bypass token window size/cost limits and focus the model on relevant snippets",
        "To speed up the model's native inference generation speed",
        "To change the pre-trained weights of the LLM core neural net",
        "To enable offline offline storage of chat history"
      ],
      correctAnswerIndex: 0,
      explanation: "While context windows have grown larger, loading massive amounts of raw data is highly expensive, introduces latency, and can lead to the model 'getting lost in the middle' of long inputs. RAG optimizes this by pre-filtering relevant content."
    };

    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      ragLessonId,
      'quiz',
      JSON.stringify(quizContent),
      null,
      2,
      now,
      now
    );

    // Block 3: RAG Prompt Playground
    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      ragLessonId,
      'playground',
      'You are a RAG Router. Rephrase the following request into a search query optimized for a semantic vector index:\n\nUser: "How do I upgrade my team\'s billing subscription plan?"',
      'prompt',
      3,
      now,
      now
    );

    // Block 4: RAG Javascript Code Block
    db.prepare(`
      INSERT INTO learning_blocks 
      (id, lesson_id, type, content, language, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      ragLessonId,
      'code',
      '// Simulate document retrieval based on tag matches\nfunction retrieveDocs(query, docs) {\n  return docs.filter(doc => \n    doc.tags.some(tag => query.toLowerCase().includes(tag))\n  );\n}\n\nconst database = [\n  { text: "Subscription upgrades can be performed under Settings > Billing.", tags: ["billing", "upgrade", "subscription"] },\n  { text: "Password reset requests take up to 5 minutes to process.", tags: ["password", "security", "reset"] }\n];\n\nconsole.log(retrieveDocs("How can I change my billing subscription?", database));',
      'javascript',
      4,
      now,
      now
    );

    console.log('✅ Seeded: RAG & Context Windows 101');
  }
};
