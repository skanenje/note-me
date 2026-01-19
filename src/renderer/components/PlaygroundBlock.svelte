<script>
  export let blockId;
  export let initialContent;
  export let language = "javascript";

  let input = initialContent || "";
  let output = "";
  let loading = false;

  async function handleRun() {
    if (!input.trim()) return;

    loading = true;
    output = "";

    try {
      // Simple local JavaScript execution
      if (language === "javascript") {
        try {
          // Use Function constructor instead of eval for safer execution
          const fn = new Function(input);
          const result = fn();
          output = String(result);
        } catch (error) {
          output = `Error: ${error.message}`;
        }
      } else {
        output = `Language ${language} execution not supported in this version`;
      }
    } catch (error) {
      output = `Error: ${error.message}`;
    }

    loading = false;
  }
</script>

<div class="my-8 border-2 border-blue-500 rounded-lg overflow-hidden bg-white">
  <div
    class="bg-gradient-to-r from-primary to-secondary text-white p-4 flex items-center gap-3"
  >
    <span class="text-2xl">🚀</span>
    <h3 class="flex-1 text-lg font-semibold">Interactive Playground</h3>
    <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold"
      >{language}</span
    >
  </div>

  <div class="p-5">
    <textarea
      bind:value={input}
      placeholder="Write your code here..."
      rows="6"
      class="w-full font-mono text-sm p-4 border border-gray-300 rounded resize-y"
    ></textarea>

    <div class="mt-4 flex gap-2">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        on:click={handleRun}
        disabled={loading}
      >
        {loading ? "⏳ Running..." : "▶ Run"}
      </button>
    </div>

    {#if output}
      <div class="mt-5 bg-gray-50 rounded overflow-hidden">
        <div class="bg-gray-200 px-4 py-2 font-bold text-sm">Output:</div>
        <pre
          class="p-4 whitespace-pre-wrap break-words leading-relaxed">{output}</pre>
      </div>
    {/if}
  </div>
</div>
