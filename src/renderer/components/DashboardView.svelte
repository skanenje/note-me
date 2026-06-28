<script>
  import { onMount, onDestroy } from 'svelte';
  import { documents } from '../stores/documents.js';
  import { openTabs } from '../stores/aitools.js';

  // ── Lessons (with progress) ───────────────────────────────────────────────
  let lessons = [];
  let loadingLessons = true;

  async function loadLessons() {
    loadingLessons = true;
    try {
      const res = await window.api.getLessons();
      if (res.success) {
        lessons = await Promise.all(res.lessons.map(async l => {
          try {
            const [det, prog] = await Promise.all([
              window.api.getLessonWithBlocks(l.id),
              window.api.getLessonProgress(l.id),
            ]);
            const total = det.success ? det.lesson.blocks.length : 0;
            const done  = prog.success ? prog.progress.filter(p => p.status === 'completed').length : 0;
            return { ...l, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
          } catch { return { ...l, total: 0, done: 0, pct: 0 }; }
        }));
      }
    } catch (e) { console.error('[DashboardView]', e); }
    finally { loadingLessons = false; }
  }

  // ── Heatmap (last 16 weeks × 7 days) ─────────────────────────────────────
  const WEEKS = 16;
  const DAYS  = WEEKS * 7;

  function buildHeatmap(docs) {
    // Map: dateKey → count of notes active that day
    const map = {};
    for (const d of (docs || [])) {
      const dt = new Date(d.updated_at || d.created_at || Date.now());
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    }

    // Build cells: oldest first
    const cells = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Pad to start on Sunday
    const startOffset = (today.getDay() + 1) % 7;
    const totalCells  = DAYS + startOffset;

    for (let i = totalCells - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      cells.push({
        date: d,
        count: map[key] || 0,
        key,
        isPad: i >= DAYS,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      });
    }
    return cells;
  }

  function heatColor(count) {
    if (count === 0) return 'var(--clr-surface2)';
    if (count === 1) return 'rgba(139,92,246,0.3)';
    if (count <= 3)  return 'rgba(139,92,246,0.55)';
    if (count <= 6)  return 'rgba(139,92,246,0.8)';
    return '#8b5cf6';
  }

  // ── Word count estimate ───────────────────────────────────────────────────
  function estimateWords(docs) {
    return docs.map(d => {
      // content is stored as HTML in blocks; we don't have it here, so estimate by title length
      // Use a placeholder — real word count would need fetching each doc
      return { title: d.title || 'Untitled', words: Math.floor(Math.random() * 800) + 50, id: d.id };
    }).sort((a, b) => b.words - a.words).slice(0, 5);
  }

  // ── Productivity tips rotator ─────────────────────────────────────────────
  const TIPS = [
    { icon: '🧠', title: 'Spaced Repetition', body: 'Review notes after 1 day, then 3 days, then a week. This locks knowledge into long-term memory.' },
    { icon: '✍️', title: 'Write to Remember', body: 'Summarizing in your own words is far more effective than re-reading. Use the editor after each lesson.' },
    { icon: '🎯', title: 'Time Blocking', body: 'Dedicate fixed slots to learning. Consistency beats intensity — 30 minutes daily beats 5 hours on weekends.' },
    { icon: '🔗', title: 'Link Ideas', body: 'Connect new concepts to things you already know. The more connections, the stronger the memory.' },
    { icon: '🌳', title: 'Feynman Technique', body: 'Explain a concept as if teaching a child. If you struggle, you\'ve found a gap — go fill it.' },
    { icon: '🎵', title: 'Focus with Music', body: 'Instrumental music (binaural beats, lo-fi) can reduce distraction during deep work sessions.' },
  ];

  let tipIdx = 0;
  let tipInterval;
  $: currentTip = TIPS[tipIdx % TIPS.length];

  // ── Derived ───────────────────────────────────────────────────────────────
  $: heatCells  = buildHeatmap($documents);
  $: topByWords = estimateWords($documents);
  $: totalNotes = $documents?.length ?? 0;
  $: aiSessions = $openTabs?.length ?? 0;
  $: allLessonsCount = lessons.length;
  $: completedLessons = lessons.filter(l => l.pct === 100).length;
  $: overallPct = lessons.length > 0
    ? Math.round(lessons.reduce((a, l) => a + l.pct, 0) / lessons.length)
    : 0;

  // Months for heatmap x-axis labels
  $: monthLabels = (() => {
    const labels = [];
    let lastMonth = -1;
    heatCells.forEach((cell, i) => {
      const m = cell.date.getMonth();
      if (!cell.isPad && m !== lastMonth) {
        lastMonth = m;
        labels.push({ idx: i, label: cell.date.toLocaleDateString('en-US', { month: 'short' }) });
      }
    });
    return labels;
  })();

  onMount(() => {
    loadLessons();
    tipInterval = setInterval(() => tipIdx++, 8000);
  });
  onDestroy(() => clearInterval(tipInterval));
</script>

<div class="dash">
  <!-- ── Header ──────────────────────────────────────────────────────────────── -->
  <div class="dash__header">
    <h1 class="dash__title">Dashboard</h1>
    <p class="dash__subtitle">Your productivity at a glance</p>
  </div>

  <div class="dash__content">
    <!-- ── Stats cards ──────────────────────────────────────────────────────── -->
    <div class="dash__stats">
      <div class="dash__stat dash__stat--purple">
        <div class="dash__stat-icon">📝</div>
        <div class="dash__stat-val">{totalNotes}</div>
        <div class="dash__stat-label">Total Notes</div>
      </div>
      <div class="dash__stat dash__stat--blue">
        <div class="dash__stat-icon">🎓</div>
        <div class="dash__stat-val">{completedLessons}/{allLessonsCount}</div>
        <div class="dash__stat-label">Tracks Completed</div>
      </div>
      <div class="dash__stat dash__stat--green">
        <div class="dash__stat-icon">📈</div>
        <div class="dash__stat-val">{overallPct}%</div>
        <div class="dash__stat-label">Overall Progress</div>
      </div>
      <div class="dash__stat dash__stat--amber">
        <div class="dash__stat-icon">🤖</div>
        <div class="dash__stat-val">{aiSessions}</div>
        <div class="dash__stat-label">AI Sessions Open</div>
      </div>
    </div>

    <!-- ── Activity Heatmap ─────────────────────────────────────────────────── -->
    <section class="dash__card">
      <h2 class="dash__card-title">Writing Activity</h2>
      <p class="dash__card-desc">Note activity over the past {WEEKS} weeks</p>

      <div class="heat">
        <!-- Month labels -->
        <div class="heat__months">
          {#each monthLabels as ml}
            <span class="heat__month" style="grid-column: {Math.floor(ml.idx / 7) + 1}">
              {ml.label}
            </span>
          {/each}
        </div>
        <!-- Day labels -->
        <div class="heat__days">
          {#each ['', 'Mon', '', 'Wed', '', 'Fri', ''] as d}
            <span class="heat__day">{d}</span>
          {/each}
        </div>
        <!-- Cells -->
        <div class="heat__grid" style="--cols: {WEEKS + 1}">
          {#each heatCells as cell}
            {#if !cell.isPad}
              <div
                class="heat__cell"
                style="background: {heatColor(cell.count)}"
                title="{cell.label}: {cell.count} note{cell.count !== 1 ? 's' : ''} updated"
              ></div>
            {:else}
              <div class="heat__cell heat__cell--pad"></div>
            {/if}
          {/each}
        </div>
        <!-- Legend -->
        <div class="heat__legend">
          <span>Less</span>
          <div class="heat__cell" style="background: var(--clr-surface2)"></div>
          <div class="heat__cell" style="background: rgba(139,92,246,0.3)"></div>
          <div class="heat__cell" style="background: rgba(139,92,246,0.55)"></div>
          <div class="heat__cell" style="background: rgba(139,92,246,0.8)"></div>
          <div class="heat__cell" style="background: #8b5cf6"></div>
          <span>More</span>
        </div>
      </div>
    </section>

    <div class="dash__row">
      <!-- ── Learning Progress ────────────────────────────────────────────── -->
      <section class="dash__card dash__card--half">
        <h2 class="dash__card-title">Learning Tracks</h2>
        {#if loadingLessons}
          {#each [1,2,3] as _}
            <div class="dash__skeleton"></div>
          {/each}
        {:else if lessons.length === 0}
          <div class="dash__empty">No tracks loaded yet.</div>
        {:else}
          <div class="dash__tracks">
            {#each lessons as l (l.id)}
              <div class="dash__track">
                <div class="dash__track-top">
                  <span class="dash__track-name">{l.title}</span>
                  <span class="dash__track-pct" class:dash__track-pct--done={l.pct === 100}>
                    {l.pct === 100 ? '✓' : `${l.pct}%`}
                  </span>
                </div>
                <div class="dash__track-bar">
                  <div
                    class="dash__track-fill"
                    class:dash__track-fill--done={l.pct === 100}
                    style="width:{l.pct}%"
                  ></div>
                </div>
                <span class="dash__track-sub">{l.done}/{l.total} blocks</span>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- ── Productivity Tip ─────────────────────────────────────────────── -->
      <section class="dash__card dash__card--half dash__tip">
        <h2 class="dash__card-title">💡 Learning Tip</h2>
        {#key tipIdx}
          <div class="tip__body">
            <div class="tip__icon">{currentTip.icon}</div>
            <div>
              <div class="tip__title">{currentTip.title}</div>
              <p class="tip__text">{currentTip.body}</p>
            </div>
          </div>
        {/key}
        <div class="tip__dots">
          {#each TIPS as _, i}
            <button
              class="tip__dot"
              class:tip__dot--active={i === tipIdx % TIPS.length}
              on:click={() => tipIdx = i}
              aria-label="Show tip {i+1}"
            ></button>
          {/each}
        </div>
      </section>
    </div>

    <!-- ── Notes Snapshot ───────────────────────────────────────────────────── -->
    {#if $documents?.length > 0}
      <section class="dash__card">
        <h2 class="dash__card-title">Note Snapshot</h2>
        <p class="dash__card-desc">Your most recently updated notes</p>
        <div class="dash__notes">
          {#each [...($documents)].sort((a,b) => new Date(b.updated_at||0)-new Date(a.updated_at||0)).slice(0,8) as doc}
            <div class="dash__note">
              <span class="dash__note-icon">{doc.icon || '📄'}</span>
              <span class="dash__note-title">{doc.title || 'Untitled'}</span>
              <span class="dash__note-date">
                {new Date(doc.updated_at || doc.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .dash {
    height: 100%;
    overflow-y: auto;
    background: var(--clr-bg);
  }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .dash__header {
    padding: 40px 48px 0;
    max-width: 1100px;
    margin: 0 auto;
  }
  .dash__title    { font-size: 2rem; font-weight: 800; color: var(--clr-text-primary); }
  .dash__subtitle { font-size: 0.9rem; color: var(--clr-text-muted); margin-top: 4px; }

  .dash__content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 48px 80px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ── Stats ──────────────────────────────────────────────────────────────── */
  .dash__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .dash__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 28px 16px;
    border-radius: 16px;
    border: 1px solid var(--clr-border);
    background: var(--clr-surface);
    text-align: center;
    transition: transform 0.2s;
  }
  .dash__stat:hover { transform: translateY(-3px); }

  .dash__stat-icon  { font-size: 1.8rem; }
  .dash__stat-val   { font-size: 2rem; font-weight: 800; color: var(--clr-text-primary); line-height: 1; }
  .dash__stat-label { font-size: 0.75rem; color: var(--clr-text-muted); font-weight: 500; }

  .dash__stat--purple { border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.06); }
  .dash__stat--purple .dash__stat-val { color: #a78bfa; }
  .dash__stat--blue   { border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.06); }
  .dash__stat--blue   .dash__stat-val { color: #60a5fa; }
  .dash__stat--green  { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.06); }
  .dash__stat--green  .dash__stat-val { color: #34d399; }
  .dash__stat--amber  { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.06); }
  .dash__stat--amber  .dash__stat-val { color: #fbbf24; }

  /* ── Cards ──────────────────────────────────────────────────────────────── */
  .dash__card {
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 16px;
    padding: 24px 28px;
  }
  .dash__card-title { font-size: 1rem; font-weight: 700; color: var(--clr-text-primary); margin-bottom: 4px; }
  .dash__card-desc  { font-size: 0.8rem; color: var(--clr-text-muted); margin-bottom: 20px; }

  .dash__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .dash__card--half {}

  /* ── Heatmap ─────────────────────────────────────────────────────────────── */
  .heat { overflow-x: auto; }

  .heat__months {
    display: grid;
    grid-template-columns: 32px repeat(var(--cols, 16), 14px);
    gap: 3px;
    margin-bottom: 4px;
    padding-left: 4px;
  }
  .heat__month {
    font-size: 0.65rem;
    color: var(--clr-text-muted);
    white-space: nowrap;
  }

  .heat__days {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
    float: left;
    margin-right: 6px;
  }
  .heat__day {
    height: 14px;
    font-size: 0.62rem;
    color: var(--clr-text-muted);
    line-height: 14px;
    white-space: nowrap;
  }

  .heat__grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 16), 14px);
    grid-auto-rows: 14px;
    grid-auto-flow: column;
    gap: 3px;
    overflow: visible;
  }

  .heat__cell {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    transition: transform 0.1s, filter 0.1s;
    cursor: default;
  }
  .heat__cell:hover { transform: scale(1.4); filter: brightness(1.3); z-index: 10; position: relative; }
  .heat__cell--pad  { opacity: 0; cursor: default; }

  .heat__legend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 12px;
    font-size: 0.7rem;
    color: var(--clr-text-muted);
    clear: both;
  }

  /* ── Tracks ──────────────────────────────────────────────────────────────── */
  .dash__tracks { display: flex; flex-direction: column; gap: 14px; }
  .dash__track {}
  .dash__track-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .dash__track-name { font-size: 0.85rem; font-weight: 600; color: var(--clr-text-primary); }
  .dash__track-pct  { font-size: 0.8rem; color: var(--clr-accent); font-weight: 700; }
  .dash__track-pct--done { color: #10b981; }
  .dash__track-bar  {
    height: 7px;
    background: var(--clr-surface2);
    border-radius: var(--r-full);
    overflow: hidden;
    margin-bottom: 4px;
  }
  .dash__track-fill {
    height: 100%;
    background: var(--grad-primary);
    border-radius: var(--r-full);
    transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  }
  .dash__track-fill--done { background: linear-gradient(90deg, #10b981, #059669); }
  .dash__track-sub  { font-size: 0.7rem; color: var(--clr-text-muted); }

  /* ── Tip ─────────────────────────────────────────────────────────────────── */
  .dash__tip { display: flex; flex-direction: column; }

  .tip__body {
    display: flex;
    gap: 16px;
    flex: 1;
    animation: tipIn 0.4s ease;
  }
  @keyframes tipIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

  .tip__icon  { font-size: 2.4rem; flex-shrink: 0; line-height: 1; margin-top: 2px; }
  .tip__title { font-size: 1rem; font-weight: 700; color: var(--clr-text-primary); margin-bottom: 6px; }
  .tip__text  { font-size: 0.85rem; color: var(--clr-text-secondary); line-height: 1.6; }

  .tip__dots {
    display: flex;
    gap: 6px;
    margin-top: 20px;
  }
  .tip__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: none;
    background: var(--clr-surface2);
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
  }
  .tip__dot--active { background: var(--clr-accent); transform: scale(1.3); }

  /* ── Notes snapshot ──────────────────────────────────────────────────────── */
  .dash__notes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
  }
  .dash__note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-radius: 10px;
    font-size: 0.82rem;
  }
  .dash__note-icon  { font-size: 1rem; flex-shrink: 0; }
  .dash__note-title { flex: 1; color: var(--clr-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dash__note-date  { font-size: 0.7rem; color: var(--clr-text-muted); flex-shrink: 0; }

  /* Misc */
  .dash__skeleton {
    height: 48px;
    background: var(--clr-surface2);
    border-radius: 10px;
    animation: pulse 1.5s ease-in-out infinite;
    margin-bottom: 10px;
  }
  .dash__empty { color: var(--clr-text-muted); font-size: 0.85rem; padding: 16px 0; }
  @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.25; } }
</style>
