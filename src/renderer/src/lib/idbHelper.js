// Helper untuk IndexedDB
export const idb = {
    openDB: () => new Promise((resolve, reject) => {
        const request = indexedDB.open('SapientiaDB', 1);
        request.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains('KeyStore')) e.target.result.createObjectStore('KeyStore'); };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    }),
    setItem: async (key, value) => {
        const db = await idb.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('KeyStore', 'readwrite');
            const request = tx.objectStore('KeyStore').put(value, key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    },
    getItem: async (key) => {
        const db = await idb.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('KeyStore', 'readonly');
            const request = tx.objectStore('KeyStore').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    }
};