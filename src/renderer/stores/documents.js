import { writable } from 'svelte/store';

export const documents = writable([]);
export const currentDocument = writable(null);
export const documentsLoading = writable(false);
export const documentsError = writable(null);

export async function loadDocuments() {
  documentsLoading.set(true);
  documentsError.set(null);
  console.log('[STORE] loadDocuments called');
  try {
    const result = await window.api.getDocuments();
    console.log('[STORE] loadDocuments result received:', result.success ? result.documents?.length + ' docs' : 'error');
    if (result.success) {
      documents.set(result.documents);
    } else {
      documentsError.set(result.error || 'Failed to load documents');
    }
  } catch (err) {
    documentsError.set(err.message);
  } finally {
    documentsLoading.set(false);
  }
}

export async function createDocument(title, parentId = null) {
  const result = await window.api.createDocument({ title, parentId });
  if (result.success) {
    await loadDocuments();
    return result.document;
  }
  throw new Error(result.error || 'Failed to create document');
}

export async function selectDocument(documentId) {
  const result = await window.api.getDocumentWithBlocks(documentId);
  if (result.success) {
    currentDocument.set(result.document);
  } else {
    throw new Error(result.error || 'Failed to load document');
  }
}

export async function updateDocumentTitle(documentId, title) {
  const result = await window.api.updateDocumentTitle({ documentId, title });
  if (result.success) {
    await loadDocuments();
    // Silently update local state
    currentDocument.update((doc) =>
      doc?.id === documentId ? { ...doc, title } : doc
    );
  } else {
    throw new Error(result.error || 'Failed to update title');
  }
}

export async function deleteDocument(documentId) {
  const result = await window.api.deleteDocument(documentId);
  if (result.success) {
    currentDocument.update((doc) => (doc?.id === documentId ? null : doc));
    await loadDocuments();
  } else {
    throw new Error(result.error || 'Failed to delete document');
  }
}

export async function refreshCurrentDocument() {
  let docId;
  const unsub = currentDocument.subscribe((d) => (docId = d?.id));
  unsub();
  if (docId) await selectDocument(docId);
}
