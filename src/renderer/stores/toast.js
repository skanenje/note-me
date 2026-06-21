import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<Array<{id:number,message:string,type:'success'|'error'|'info'}>>} */
export const toasts = writable([]);

let _nextId = 0;

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration  ms before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3500) {
  const id = _nextId++;
  toasts.update((t) => [...t, { id, message, type }]);
  setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id) {
  toasts.update((t) => t.filter((toast) => toast.id !== id));
}

export const toast = {
  success: (msg, duration) => showToast(msg, 'success', duration),
  error:   (msg, duration) => showToast(msg, 'error',   duration ?? 5000),
  info:    (msg, duration) => showToast(msg, 'info',    duration),
};
