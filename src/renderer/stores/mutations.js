import { writable } from 'svelte/store';

export const mutations = writable([]);

export async function loadMutations(limit = 50) {
  const result = await window.api.getAllMutations(limit);
  if (result.success) {
    mutations.set(result.mutations);
  }
}

export async function simulateSync() {
  const result = await window.api.getUnsyncedMutations();
  if (result.success && result.mutations.length > 0) {
    const ids = result.mutations.map(m => m.id);
    await window.api.markMutationsSynced(ids);
    await loadMutations();
    return ids.length;
  }
  return 0;
}
