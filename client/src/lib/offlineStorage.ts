/**
 * IndexedDB wrapper for offline data storage
 */

const DB_NAME = 'filipe_treinos_offline';
const DB_VERSION = 1;

interface OfflineData {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
}

interface PendingSync {
  id?: number;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
}

let db: IDBDatabase | null = null;

export async function initOfflineDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store for cached data
      if (!database.objectStoreNames.contains('cache')) {
        const cacheStore = database.createObjectStore('cache', {
          keyPath: 'id',
          autoIncrement: true,
        });
        cacheStore.createIndex('key', 'key', { unique: true });
      }

      // Store for pending sync operations
      if (!database.objectStoreNames.contains('sync_queue')) {
        database.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };
  });
}

async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    await initOfflineDB();
  }
  return db!;
}

// Cache operations
export async function cacheData(key: string, data: any): Promise<void> {
  const database = await getDB();
  const transaction = database.transaction(['cache'], 'readwrite');
  const store = transaction.objectStore('cache');
  
  const item: OfflineData = {
    key,
    data,
    timestamp: Date.now(),
  };

  // Try to update existing, or add new
  const index = store.index('key');
  const existing = await new Promise<OfflineData | undefined>((resolve) => {
    const request = index.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(undefined);
  });

  if (existing) {
    item.id = existing.id;
    store.put(item);
  } else {
    store.add(item);
  }
}

export async function getCachedData(key: string): Promise<any | null> {
  const database = await getDB();
  const transaction = database.transaction(['cache'], 'readonly');
  const store = transaction.objectStore('cache');
  const index = store.index('key');

  return new Promise((resolve) => {
    const request = index.get(key);
    request.onsuccess = () => {
      const result = request.result as OfflineData | undefined;
      resolve(result ? result.data : null);
    };
    request.onerror = () => resolve(null);
  });
}

export async function clearCache(): Promise<void> {
  const database = await getDB();
  const transaction = database.transaction(['cache'], 'readwrite');
  const store = transaction.objectStore('cache');
  store.clear();
}

// Sync queue operations
export async function addToSyncQueue(
  endpoint: string,
  method: string,
  data: any
): Promise<void> {
  const database = await getDB();
  const transaction = database.transaction(['sync_queue'], 'readwrite');
  const store = transaction.objectStore('sync_queue');

  const item: PendingSync = {
    endpoint,
    method,
    data,
    timestamp: Date.now(),
  };

  store.add(item);
}

export async function getSyncQueue(): Promise<PendingSync[]> {
  const database = await getDB();
  const transaction = database.transaction(['sync_queue'], 'readonly');
  const store = transaction.objectStore('sync_queue');

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  const database = await getDB();
  const transaction = database.transaction(['sync_queue'], 'readwrite');
  const store = transaction.objectStore('sync_queue');
  store.delete(id);
}

export async function clearSyncQueue(): Promise<void> {
  const database = await getDB();
  const transaction = database.transaction(['sync_queue'], 'readwrite');
  const store = transaction.objectStore('sync_queue');
  store.clear();
}

// Online/offline status
export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnline(callback: () => void): () => void {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function onOffline(callback: () => void): () => void {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}
