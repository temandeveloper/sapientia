// Helper untuk Kriptografi
export const cryptoHelper = {
    createKey: async () => await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']),
    exportKey: async (key) => await window.crypto.subtle.exportKey('jwk', key),
    importKey: async (jwk) => await window.crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']),
    encryptData: async (key, data) => {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(JSON.stringify(data));
        const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);
        const buffer = new Uint8Array(iv.length + encrypted.byteLength);
        buffer.set(iv);
        buffer.set(new Uint8Array(encrypted), iv.length);
        return btoa(String.fromCharCode.apply(null, buffer));
    },
    decryptData: async (key, base64Data) => {
        const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const iv = buffer.slice(0, 12);
        const encrypted = buffer.slice(12);
        const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
        return JSON.parse(new TextDecoder().decode(decrypted));
    }
};