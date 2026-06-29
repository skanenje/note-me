<script>
  console.log('[SVELTE] WorkspaceView.svelte script tag is executing!');
  import { onMount, onDestroy } from 'svelte';
  import { documents, loadDocuments, createDocument, selectDocument } from '../stores/documents.js';
  import { settings } from '../stores/settings.js';
  import { openTabs } from '../stores/aitools.js';
  import { toast } from '../stores/toast.js';

  export let onNavigate;
  export let onSelectLesson;

  // ── Greeting ──────────────────────────────────────────────────────────────
  function getGreeting(name) {
    const h = new Date().getHours();
    const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const first = (name || 'there').split(' ')[0];
    return `${salutation}, ${first}`;
  }

  function getDayInfo() {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  // ── Writing streak ────────────────────────────────────────────────────────
  function calcStreak(docs) {
    if (!docs || !docs.length) return 0;
    const activeDays = new Set(docs.map(d => {
      const dt = new Date(d.updated_at || d.created_at || Date.now());
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    }));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let cursor = today.getTime();
    while (activeDays.has(cursor)) {
      streak++;
      cursor -= 86400000;
    }
    return streak;
  }

  // ── Lessons ───────────────────────────────────────────────────────────────
  let lessons = [];
  let loadingLessons = true;
  let lessonsError = null;

  function logBoth(msg, isError = false) {
    if (isError) console.error(msg);
    else console.log(msg);
    if (window.api && window.api.log) window.api.log(msg);
  }

  async function loadLessons() {
    console.log('[WorkspaceView] loadLessons() called');
    loadingLessons = true;
    logBoth('[WorkspaceView] loadLessons started');
    try {
      const res = await window.api.getLessons();
      logBoth('[WorkspaceView] getLessons returned: ' + (res ? JSON.stringify(res).substring(0, 200) : 'null/undefined'));
      if (res && res.success) {
        logBoth('[WorkspaceView] Processing ' + (res.lessons ? res.lessons.length : 0) + ' lessons');
        const withProg = await Promise.all(res.lessons.map(async lesson => {
          try {
            const [detRes, progRes] = await Promise.all([
              window.api.getLessonWithBlocks(lesson.id),
              window.api.getLessonProgress(lesson.id),
            ]);
            const totalBlocks = (detRes && detRes.success && detRes.lesson && detRes.lesson.blocks) ? detRes.lesson.blocks.length : 0;
            const completedCount = (progRes && progRes.success && progRes.progress)
              ? progRes.progress.filter(p => p.status === 'completed').length
              : 0;
            return {
              ...lesson,
              totalBlocks,
              completedCount,
              progressPct: totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0,
            };
          } catch { return { ...lesson, totalBlocks: 0, completedCount: 0, progressPct: 0 }; }
        }));
        lessons = withProg;
        logBoth('[WorkspaceView] Successfully set lessons array, length: ' + lessons.length);
      } else {
        logBoth('[WorkspaceView] getLessons res.success is false or undefined. res: ' + JSON.stringify(res));
      }
    } catch (e) { 
      logBoth('[WorkspaceView] loadLessons EXCEPTION: ' + e.message + '\n' + e.stack, true);
      lessonsError = e.message || String(e);
    }
    finally { loadingLessons = false; }
  }

  // ── Pomodoro ──────────────────────────────────────────────────────────────
  const WORK_MINS  = 25;
  const BREAK_MINS = 5;
  let timerMode    = 'work';
  let timerRunning = false;
  let timerSeconds = WORK_MINS * 60;
  let pomInterval  = null;
  let pomRings     = 0; // completed pomodoros this session

  const RADIUS = 44;
  const CIRC   = 2 * Math.PI * RADIUS;

  $: totalSecs = timerMode === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60;
  $: elapsed   = totalSecs - timerSeconds;
  $: pomOffset = CIRC - (elapsed / totalSecs) * CIRC;

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(pomInterval);
      timerRunning = false;
    } else {
      timerRunning = true;
      pomInterval = setInterval(() => {
        timerSeconds--;
        if (timerSeconds <= 0) {
          clearInterval(pomInterval);
          timerRunning = false;
          if (timerMode === 'work') {
            pomRings++;
            timerMode    = 'break';
            timerSeconds = BREAK_MINS * 60;
            toast.success(`Pomodoro #${pomRings} complete! Take a 5-min break 🎉`);
          } else {
            timerMode    = 'work';
            timerSeconds = WORK_MINS * 60;
            toast.info('Break over — time to focus 💪');
          }
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(pomInterval);
    timerRunning = false;
    timerMode    = 'work';
    timerSeconds = WORK_MINS * 60;
  }

  function skipPhase() {
    clearInterval(pomInterval);
    timerRunning = false;
    if (timerMode === 'work') {
      timerMode    = 'break';
      timerSeconds = BREAK_MINS * 60;
    } else {
      timerMode    = 'work';
      timerSeconds = WORK_MINS * 60;
    }
  }

  function fmtTime(s) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  // ── Quick actions ─────────────────────────────────────────────────────────
  async function handleNewNote() {
    await onNavigate('documents');
    try {
      const doc = await createDocument('Untitled');
      await selectDocument(doc.id);
    } catch (err) { toast.error('Could not create note: ' + err.message); }
  }

  async function handleContinueLearning() {
    const inProgress = lessons.find(l => l.progressPct > 0 && l.progressPct < 100);
    await onNavigate('lessons');
    if (inProgress && onSelectLesson) onSelectLesson(inProgress.id);
  }

  // ── Motivational quotes ───────────────────────────────────────────────────
  const QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
    { text: "Learning is not attained by chance, it must be sought for with ardor.", author: "Abigail Adams" },
    { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
    { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  ];
  $: quoteIdx = new Date().getDate() % QUOTES.length;
  $: quote    = QUOTES[quoteIdx];

  // ── Derived ───────────────────────────────────────────────────────────────
  $: streak       = calcStreak($documents);
  $: recentDocs   = [...($documents || [])].sort((a, b) =>
    new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
  ).slice(0, 8);
  $: activeTracks = lessons.filter(l => l.progressPct > 0 && l.progressPct < 100);
  $: doneTracks   = lessons.filter(l => l.progressPct === 100);

  onMount(async () => {
    console.log('[SVELTE] WorkspaceView onMount executed');
    // Ensure contextBridge is ready before first IPC call
    await new Promise(r => setTimeout(r, 0));
    // WorkspaceView is the default landing page — load documents proactively
    await loadDocuments();
    loadLessons();
  });
  onDestroy(() => clearInterval(pomInterval));
</script>

<div class="ws">
  <!-- ── Hero ──────────────────────────────────────────────────────────────── -->
  <div class="ws__hero">
    <div class="ws__hero-glow"></div>
    <div class="ws__hero-content">
      <div class="ws__hero-left">
        <p class="ws__date">{getDayInfo()}</p>
        <h1 class="ws__greeting">{getGreeting($settings.userName)}</h1>
        <p class="ws__quote">"{quote.text}" <span class="ws__quote-author">— {quote.author}</span></p>

        <!-- Stats row -->
        <div class="ws__stats">
          <div class="ws__stat">
            <span class="ws__stat-val">{$documents?.length ?? 0}</span>
            <span class="ws__stat-label">Notes</span>
          </div>
          <div class="ws__stat-sep"></div>
          <div class="ws__stat">
            <span class="ws__stat-val">{streak}</span>
            <span class="ws__stat-label">Day streak 🔥</span>
          </div>
          <div class="ws__stat-sep"></div>
          <div class="ws__stat">
            <span class="ws__stat-val">{$openTabs?.length ?? 0}</span>
            <span class="ws__stat-label">AI sessions</span>
          </div>
          <div class="ws__stat-sep"></div>
          <div class="ws__stat">
            <span class="ws__stat-val">{lessons.length}</span>
            <span class="ws__stat-label">Tracks</span>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="ws__actions">
          <button class="ws__action ws__action--primary" on:click={handleNewNote}>
            <span class="ws__action-icon">✏️</span>
            <div>
              <div class="ws__action-title">New Note</div>
              <div class="ws__action-desc">Start writing</div>
            </div>
          </button>
          <button class="ws__action" on:click={handleContinueLearning}>
            <span class="ws__action-icon">🎓</span>
            <div>
              <div class="ws__action-title">Continue Learning</div>
              <div class="ws__action-desc">{activeTracks.length} track{activeTracks.length !== 1 ? 's' : ''} in progress</div>
            </div>
          </button>
          <button class="ws__action" on:click={() => onNavigate('aitools')}>
            <span class="ws__action-icon">🤖</span>
            <div>
              <div class="ws__action-title">AI Tools</div>
              <div class="ws__action-desc">Open a session</div>
            </div>
          </button>
          <button class="ws__action" on:click={() => onNavigate('prompt-enhancer')}>
            <span class="ws__action-icon">✨</span>
            <div>
              <div class="ws__action-title">Enhance Prompt</div>
              <div class="ws__action-desc">Refine your ideas</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Pomodoro widget -->
      <div class="pom">
        <div class="pom__label">{timerMode === 'work' ? 'Focus Session' : '☕ Break Time'}</div>
        <div class="pom__ring-wrap">
          <svg class="pom__ring" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="{RADIUS}" class="pom__track"/>
            <circle
              cx="50" cy="50" r="{RADIUS}"
              class="pom__fill"
              class:pom__fill--break={timerMode === 'break'}
              stroke-dasharray="{CIRC}"
              stroke-dashoffset="{pomOffset}"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="pom__center">
            <div class="pom__time">{fmtTime(timerSeconds)}</div>
            <div class="pom__phase">{timerMode === 'work' ? '🎯 Work' : '🌿 Rest'}</div>
          </div>
        </div>
        <div class="pom__controls">
          <button class="pom__btn pom__btn--skip" on:click={resetTimer} title="Reset">↺</button>
          <button class="pom__btn pom__btn--main" on:click={toggleTimer}>
            {timerRunning ? '⏸' : '▶'}
          </button>
          <button class="pom__btn pom__btn--skip" on:click={skipPhase} title="Skip phase">⏭</button>
        </div>
        {#if pomRings > 0}
          <div class="pom__rings">
            {#each Array(pomRings) as _}
              <span class="pom__ring-dot">🍅</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="ws__body">
    <!-- ── Recent Notes ──────────────────────────────────────────────────── -->
    <section class="ws__section">
      <div class="ws__section-header">
        <h2 class="ws__section-title">Recent Notes</h2>
        <button class="ws__section-link" on:click={() => onNavigate('documents')}>
          View all →
        </button>
      </div>
      {#if recentDocs.length === 0}
        <div class="ws__empty">
          <span>📄</span>
          <p>No notes yet. Create your first one!</p>
          <button class="ws__empty-btn" on:click={handleNewNote}>+ New Note</button>
        </div>
      {:else}
        <div class="ws__notes-grid">
          {#each recentDocs as doc (doc.id)}
            <button
              class="ws__note-card"
              on:click={() => { onNavigate('documents'); selectDocument(doc.id); }}
            >
              <div class="ws__note-icon">{doc.icon || '📄'}</div>
              <div class="ws__note-info">
                <div class="ws__note-title">{doc.title || 'Untitled'}</div>
                <div class="ws__note-date">
                  {new Date(doc.updated_at || doc.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ── Learning Tracks ───────────────────────────────────────────────── -->
    <section class="ws__section">
      <div class="ws__section-header">
        <h2 class="ws__section-title">Learning Progress</h2>
        <button class="ws__section-link" on:click={() => onNavigate('lessons')}>
          All tracks →
        </button>
      </div>
      {#if loadingLessons}
        {#each [1,2,3] as _}
          <div class="ws__track-skeleton"></div>
        {/each}
      {:else if lessonsError}
        <div class="ws__empty">
          <span>⚠️</span><p>Error: {lessonsError}</p>
        </div>
      {:else if lessons.length === 0}
        <div class="ws__empty">
          <span>🎓</span><p>No learning tracks available.</p>
        </div>
      {:else}
        <div class="ws__tracks">
          {#each lessons as lesson (lesson.id)}
            <button
              class="ws__track"
              on:click={async () => { await onNavigate('lessons'); onSelectLesson && onSelectLesson(lesson.id); }}
            >
              <div class="ws__track-header">
                <span class="ws__track-name">{lesson.title}</span>
                <span class="ws__track-pct" class:ws__track-pct--done={lesson.progressPct === 100}>
                  {lesson.progressPct === 100 ? '✓ Done' : `${lesson.progressPct}%`}
                </span>
              </div>
              <div class="ws__track-bar">
                <div
                  class="ws__track-fill"
                  class:ws__track-fill--done={lesson.progressPct === 100}
                  style="width: {lesson.progressPct}%"
                ></div>
              </div>
              <div class="ws__track-meta">
                {lesson.completedCount}/{lesson.totalBlocks} blocks completed
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .ws {
    height: 100%;
    overflow-y: auto;
    background: var(--clr-bg);
  }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .ws__hero {
    position: relative;
    background: linear-gradient(135deg, #0d1b3e 0%, #1a0533 50%, #0d1b3e 100%);
    overflow: hidden;
    padding: 48px 48px 40px;
  }

  .ws__hero-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 20% 50%, rgba(139,92,246,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 80% 20%, rgba(59,130,246,0.12) 0%, transparent 50%);
    pointer-events: none;
  }

  .ws__hero-content {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 48px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .ws__hero-left { flex: 1; min-width: 0; }

  .ws__date {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(167,139,250,0.8);
    margin-bottom: 8px;
  }

  .ws__greeting {
    font-size: 2.2rem;
    font-weight: 800;
    color: #f1f5f9;
    margin-bottom: 12px;
    line-height: 1.2;
  }

  .ws__quote {
    font-size: 0.88rem;
    color: rgba(203,213,225,0.7);
    font-style: italic;
    margin-bottom: 28px;
    max-width: 520px;
    line-height: 1.6;
  }
  .ws__quote-author { font-style: normal; color: rgba(167,139,250,0.8); font-weight: 600; }

  /* Stats */
  .ws__stats {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 28px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 14px 24px;
    width: fit-content;
    backdrop-filter: blur(8px);
  }
  .ws__stat { text-align: center; padding: 0 20px; }
  .ws__stat:first-child { padding-left: 0; }
  .ws__stat-val {
    display: block;
    font-size: 1.6rem;
    font-weight: 800;
    color: #f1f5f9;
    line-height: 1;
    margin-bottom: 4px;
  }
  .ws__stat-label { font-size: 0.72rem; color: rgba(148,163,184,0.8); font-weight: 500; white-space: nowrap; }
  .ws__stat-sep { width: 1px; height: 36px; background: rgba(255,255,255,0.12); flex-shrink: 0; }

  /* Quick actions */
  .ws__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ws__action {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;
    color: #e2e8f0;
    font-family: inherit;
    backdrop-filter: blur(6px);
  }
  .ws__action:hover {
    background: rgba(139,92,246,0.2);
    border-color: rgba(139,92,246,0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(139,92,246,0.2);
  }
  .ws__action--primary {
    background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2));
    border-color: rgba(139,92,246,0.4);
  }
  .ws__action-icon { font-size: 1.4rem; line-height: 1; flex-shrink: 0; }
  .ws__action-title { font-size: 0.85rem; font-weight: 700; color: #f1f5f9; }
  .ws__action-desc  { font-size: 0.72rem; color: rgba(148,163,184,0.8); margin-top: 1px; }

  /* ── Pomodoro ─────────────────────────────────────────────────────────────── */
  .pom {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 24px 28px;
    backdrop-filter: blur(12px);
    min-width: 200px;
  }

  .pom__label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(167,139,250,0.9);
  }

  .pom__ring-wrap {
    position: relative;
    width: 140px;
    height: 140px;
  }

  .pom__ring {
    width: 100%;
    height: 100%;
    transform: rotate(0deg);
  }

  .pom__track {
    fill: none;
    stroke: rgba(255,255,255,0.08);
    stroke-width: 8;
  }

  .pom__fill {
    fill: none;
    stroke: #8b5cf6;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear, stroke 0.4s;
  }
  .pom__fill--break { stroke: #10b981; }

  .pom__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .pom__time {
    font-size: 1.9rem;
    font-weight: 800;
    color: #f1f5f9;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .pom__phase { font-size: 0.72rem; color: rgba(148,163,184,0.8); margin-top: 4px; }

  .pom__controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pom__btn {
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    font-size: 1rem;
    font-family: inherit;
  }

  .pom__btn--main {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    color: white;
    font-size: 1.2rem;
    box-shadow: 0 4px 16px rgba(139,92,246,0.4);
  }
  .pom__btn--main:hover { transform: scale(1.06); box-shadow: 0 6px 22px rgba(139,92,246,0.55); }

  .pom__btn--skip {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.07);
    color: rgba(148,163,184,0.8);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 1rem;
  }
  .pom__btn--skip:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }

  .pom__rings { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; max-width: 160px; }
  .pom__ring-dot { font-size: 0.85rem; }

  /* ── Body ────────────────────────────────────────────────────────────────── */
  .ws__body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 48px 80px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  .ws__section {}

  .ws__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .ws__section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--clr-text-primary);
  }

  .ws__section-link {
    font-size: 0.8rem;
    color: var(--clr-accent);
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 600;
    padding: 0;
    font-family: inherit;
    transition: opacity 0.15s;
  }
  .ws__section-link:hover { opacity: 0.75; }

  /* Notes grid */
  .ws__notes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .ws__note-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;
    font-family: inherit;
  }
  .ws__note-card:hover {
    border-color: var(--clr-accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    background: var(--clr-surface2);
  }
  .ws__note-icon { font-size: 1.4rem; flex-shrink: 0; }
  .ws__note-info { flex: 1; min-width: 0; }
  .ws__note-title { font-size: 0.85rem; font-weight: 600; color: var(--clr-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ws__note-date  { font-size: 0.72rem; color: var(--clr-text-muted); margin-top: 2px; }

  /* Empty */
  .ws__empty {
    text-align: center;
    padding: 32px;
    color: var(--clr-text-muted);
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .ws__empty span { font-size: 2rem; opacity: 0.4; }
  .ws__empty-btn {
    padding: 7px 18px;
    background: var(--grad-primary);
    color: white;
    border: none;
    border-radius: var(--r-full);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    margin-top: 4px;
    transition: all 0.15s;
  }
  .ws__empty-btn:hover { opacity: 0.85; transform: translateY(-1px); }

  /* Tracks */
  .ws__tracks { display: flex; flex-direction: column; gap: 10px; }

  .ws__track {
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 12px;
    padding: 16px 20px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: all 0.18s;
    width: 100%;
  }
  .ws__track:hover { border-color: var(--clr-accent); background: var(--clr-surface2); }

  .ws__track-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .ws__track-name { font-size: 0.9rem; font-weight: 600; color: var(--clr-text-primary); }
  .ws__track-pct  { font-size: 0.78rem; font-weight: 700; color: var(--clr-accent); }
  .ws__track-pct--done { color: #10b981; }

  .ws__track-bar {
    height: 6px;
    background: var(--clr-surface2);
    border-radius: var(--r-full);
    overflow: hidden;
    margin-bottom: 8px;
  }

  .ws__track-fill {
    height: 100%;
    background: var(--grad-primary);
    border-radius: var(--r-full);
    transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  }
  .ws__track-fill--done { background: linear-gradient(90deg, #10b981, #059669); }

  .ws__track-meta {
    font-size: 0.72rem;
    color: var(--clr-text-muted);
  }

  .ws__track-skeleton {
    height: 80px;
    background: var(--clr-surface2);
    border-radius: 12px;
    animation: pulse 1.5s ease-in-out infinite;
    margin-bottom: 10px;
  }
  @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.25; } }
</style>
