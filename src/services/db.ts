class LocalDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('SanctaBibliaDB', 2);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };
      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      req.onerror = (e) => {
        reject((e.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readonly');
      const req = tx.objectStore('store').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async set<T = any>(key: string, val: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readwrite');
      const req = tx.objectStore('store').put(val, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readwrite');
      const req = tx.objectStore('store').delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllKeys(): Promise<string[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readonly');
      const req = tx.objectStore('store').getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deletePrefix(prefix: string): Promise<number> {
    const db = await this.init();
    const keys = await this.getAllKeys();
    const matching = keys.filter(k => typeof k === 'string' && k.startsWith(prefix));
    if (matching.length === 0) return 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      matching.forEach(k => store.delete(k));
      tx.oncomplete = () => resolve(matching.length);
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDB = new LocalDB();
