<script>
  import { createEventDispatcher } from 'svelte';

  export let blockId;
  export let content; // JSON string

  const dispatch = createEventDispatcher();

  let quizData = null;
  let selectedOption = null;
  let showExplanation = false;
  let isCorrect = null;

  $: {
    try {
      quizData = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      console.error('Failed to parse quiz content:', e);
      quizData = null;
    }
  }

  function handleOptionSelect(index) {
    if (showExplanation && isCorrect) return; // already solved correctly
    selectedOption = index;
    isCorrect = index === quizData.correctAnswerIndex;
  }

  function handleSubmit() {
    if (selectedOption === null) return;
    showExplanation = true;
    if (isCorrect) {
      dispatch('run', { blockId, success: true });
    }
  }

  function handleRetry() {
    selectedOption = null;
    showExplanation = false;
    isCorrect = null;
  }
</script>

{#if quizData}
  <div class="quiz-block" class:quiz-block--solved={showExplanation && isCorrect}>
    <div class="quiz-block__header">
      <span class="quiz-block__badge">🧠 Knowledge Check</span>
    </div>

    <div class="quiz-block__body">
      <p class="quiz-block__question">{quizData.question}</p>

      <div class="quiz-block__options">
        {#each quizData.options as option, idx}
          <button
            class="quiz-option"
            class:quiz-option--selected={selectedOption === idx}
            class:quiz-option--correct={showExplanation && quizData.correctAnswerIndex === idx}
            class:quiz-option--wrong={showExplanation && selectedOption === idx && !isCorrect}
            on:click={() => handleOptionSelect(idx)}
            disabled={showExplanation && isCorrect}
          >
            <div class="quiz-option__indicator">
              {String.fromCharCode(65 + idx)}
            </div>
            <span class="quiz-option__text">{option}</span>
          </button>
        {/each}
      </div>

      <div class="quiz-block__actions">
        {#if !showExplanation || !isCorrect}
          <button
            class="quiz-btn quiz-btn--primary"
            disabled={selectedOption === null}
            on:click={handleSubmit}
          >
            Submit Answer
          </button>
        {/if}

        {#if showExplanation && !isCorrect}
          <button class="quiz-btn quiz-btn--secondary" on:click={handleRetry}>
            Try Again
          </button>
        {/if}
      </div>

      {#if showExplanation}
        <div
          class="quiz-explanation"
          class:quiz-explanation--correct={isCorrect}
          class:quiz-explanation--wrong={!isCorrect}
        >
          <div class="quiz-explanation__header">
            {isCorrect ? '✓ Correct!' : '✕ Incorrect'}
          </div>
          <p class="quiz-explanation__text">{quizData.explanation}</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .quiz-block {
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-lg);
    padding: 24px;
    box-shadow: var(--shadow-md);
    transition: all var(--t-normal);
  }

  .quiz-block--solved {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
  }

  .quiz-block__badge {
    background: rgba(124, 58, 237, 0.15);
    border: 1px solid rgba(124, 58, 237, 0.3);
    color: #c4b5fd;
    padding: 3px 10px;
    border-radius: var(--r-full);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .quiz-block__question {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--clr-text-primary);
    margin: 16px 0 20px;
    line-height: 1.5;
  }

  .quiz-block__options {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .quiz-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: var(--r-md);
    color: var(--clr-text-secondary);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 0.9rem;
    transition: all var(--t-fast);
  }

  .quiz-option:hover:not(:disabled) {
    border-color: var(--clr-accent);
    color: var(--clr-text-primary);
    background: var(--clr-surface2);
  }

  .quiz-option--selected {
    border-color: var(--clr-accent);
    background: rgba(124, 58, 237, 0.08);
    color: var(--clr-text-primary);
  }

  .quiz-option--correct {
    border-color: var(--clr-success);
    background: rgba(16, 185, 129, 0.08);
    color: #6ee7b7;
  }

  .quiz-option--wrong {
    border-color: var(--clr-danger);
    background: rgba(239, 68, 68, 0.08);
    color: #fca5a5;
  }

  .quiz-option__indicator {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--clr-surface2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--clr-text-secondary);
    border: 1px solid var(--clr-border);
    flex-shrink: 0;
  }

  .quiz-option--selected .quiz-option__indicator {
    background: var(--clr-accent);
    color: white;
    border-color: var(--clr-accent);
  }

  .quiz-option--correct .quiz-option__indicator {
    background: var(--clr-success);
    color: white;
    border-color: var(--clr-success);
  }

  .quiz-option--wrong .quiz-option__indicator {
    background: var(--clr-danger);
    color: white;
    border-color: var(--clr-danger);
  }

  .quiz-option__text {
    line-height: 1.4;
  }

  .quiz-block__actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .quiz-btn {
    padding: 8px 20px;
    border-radius: var(--r-md);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: inherit;
  }

  .quiz-btn--primary {
    background: var(--grad-primary);
    color: white;
    border: none;
  }

  .quiz-btn--primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--clr-accent-glow);
  }

  .quiz-btn--primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .quiz-btn--secondary {
    background: transparent;
    border: 1px solid var(--clr-border);
    color: var(--clr-text-secondary);
  }

  .quiz-btn--secondary:hover {
    background: var(--clr-surface2);
    color: var(--clr-text-primary);
  }

  .quiz-explanation {
    margin-top: 20px;
    padding: 16px;
    border-radius: var(--r-md);
    border: 1px solid transparent;
    animation: slideUp 300ms ease forwards;
  }

  .quiz-explanation--correct {
    background: rgba(16, 185, 129, 0.05);
    border-color: rgba(16, 185, 129, 0.2);
  }

  .quiz-explanation--wrong {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .quiz-explanation__header {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .quiz-explanation--correct .quiz-explanation__header {
    color: #6ee7b7;
  }

  .quiz-explanation--wrong .quiz-explanation__header {
    color: #fca5a5;
  }

  .quiz-explanation__text {
    font-size: 0.85rem;
    color: var(--clr-text-secondary);
    line-height: 1.5;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
