import { writable } from 'svelte/store';

export const documents = writable([]);
export const currentDocument = writable(null);

export async function loadDocuments() {
  const result = await window.api.getDocuments();
  if (result.success) {
    documents.set(result.documents);
  }
}

export async function createDocument(title) {
  const result = await window.api.createDocument(title);
  if (result.success) {
    await loadDocuments();
    return result.document;
  }
  throw new Error(result.error);
}

export async function selectDocument(documentId) {
  const result = await window.api.getDocumentWithBlocks(documentId);
  if (result.success) {
    currentDocument.set(result.document);
  }
}

export async function updateDocumentTitle(documentId, title) {
  const result = await window.api.updateDocumentTitle({ documentId, title });
  if (result.success) {
    await loadDocuments();
    await selectDocument(documentId);
  }
}
