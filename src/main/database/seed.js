// Seed script for "Prompt Engineering 101" lesson
const { v4: uuidv4 } = require('uuid');

module.exports = function seedPromptEngineering101(db) {
  // Check if already seeded
  const check = db.prepare('SELECT COUNT(*) as count FROM lessons').get();
  if (check.count > 0) {
    console.log('Database already seeded');
    return;
  }
  
  const lessonId = uuidv4();
  const now = Date.now();
  
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
};
