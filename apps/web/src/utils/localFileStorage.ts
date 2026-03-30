const DB_NAME = 'videoplayer-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

interface StoredFile {
  key: string;
  blob: Blob;
  type: 'video' | 'thumbnail';
  videoId: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('videoId', 'videoId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFile(key: string, blob: Blob, type: 'video' | 'thumbnail', videoId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ key, blob, type, videoId } satisfies StoredFile);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadFile(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => {
      const result = request.result as StoredFile | undefined;
      resolve(result?.blob ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function loadFilesByVideoId(videoId: string): Promise<{ video?: Blob; thumbnail?: Blob }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('videoId');
    const request = index.getAll(videoId);
    request.onsuccess = () => {
      const results = request.result as StoredFile[];
      const video = results.find((r) => r.type === 'video')?.blob;
      const thumbnail = results.find((r) => r.type === 'thumbnail')?.blob;
      resolve({ video, thumbnail });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFilesByVideoId(videoId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('videoId');
    const request = index.getAllKeys(videoId);
    request.onsuccess = () => {
      for (const key of request.result) {
        store.delete(key);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllStoredVideoIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const results = request.result as StoredFile[];
      const ids = [...new Set(results.map((r) => r.videoId))];
      resolve(ids);
    };
    request.onerror = () => reject(request.error);
  });
}
