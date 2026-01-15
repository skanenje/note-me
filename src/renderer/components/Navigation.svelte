<script>
  export let currentView = 'lessons'; // 'lessons', 'documents'
  export let onNavigate;
</script>

<nav class="navigation">
  <div class="nav-header">
    <h1>🎓 Note-Me LMS</h1>
    <p class="tagline">Learn AI, Build AI</p>
  </div>
  
  <div class="nav-items">
    <button 
      class="nav-item"
      class:active={currentView === 'lessons'}
      on:click={() => onNavigate('lessons')}
    >
      <span class="icon">📚</span>
      <span>Learning Tracks</span>
    </button>
    
    <button 
      class="nav-item"
      class:active={currentView === 'documents'}
      on:click={() => onNavigate('documents')}
    >
      <span class="icon">📝</span>
      <span>My Notes</span>
    </button>
  </div>
</nav>

<style>
  .navigation {
    padding: 20px;
    border-right: 1px solid #ddd;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    flex-direction: column;
  }
  
  .nav-header {
    margin-bottom: 30px;
  }
  
  .nav-header h1 {
    font-size: 24px;
    margin: 0 0 5px 0;
  }
  
  .tagline {
    font-size: 12px;
    opacity: 0.8;
    margin: 0;
  }
  
  .nav-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .nav-item {
    width: 100%;
    text-align: left;
    padding: 12px 15px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
  }
  
  .nav-item:hover {
    background: rgba(255,255,255,0.2);
  }
  
  .nav-item.active {
    background: white;
    color: #667eea;
    font-weight: bold;
  }
  
  .icon {
    font-size: 20px;
  }
</style>
