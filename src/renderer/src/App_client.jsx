import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Scan, 
    CheckCircle, 
    Wifi, 
    WifiOff, 
    XCircle,
    Camera
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get } from "firebase/database";
import { Html5Qrcode } from 'html5-qrcode';
import '../assets/xterm.css';
import '../assets/output.css';

// --- START: Firebase Configuration & Helpers ---

// NOTE: This configuration must match your host application's configuration.
const firebaseConfig = {
  apiKey: "AIzaSyCwf2Z0tZSCxVmv0fNt3xC-0tSMjTmqdO8",
  authDomain: "sapientia-app-rtc.firebaseapp.com",
  databaseURL: "https://sapientia-app-rtc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sapientia-app-rtc",
  storageBucket: "sapientia-app-rtc.firebasestorage.app",
  messagingSenderId: "787603394068",
  appId: "1:787603394068:web:6600664367ff471ca9e101"
};

const app = initializeApp(firebaseConfig);
const firebaseDb = getDatabase(app);

// Helper for IndexedDB to store the encryption key
const idb = {
    openDB: () => new Promise((resolve, reject) => {
        const request = indexedDB.open('SapientiaClientDB', 1);
        request.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains('ClientKeyStore')) e.target.result.createObjectStore('ClientKeyStore'); };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    }),
    setItem: async (key, value) => {
        const db = await idb.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ClientKeyStore', 'readwrite');
            const request = tx.objectStore('ClientKeyStore').put(value, key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    },
    getItem: async (key) => {
        const db = await idb.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ClientKeyStore', 'readonly');
            const request = tx.objectStore('ClientKeyStore').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    }
};

// Cryptography Helper for secure data exchange
const cryptoHelper = {
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

// --- END: Firebase Configuration & Helpers ---

// Custom Scrollbar Styles to match the host app
const CustomScrollbarStyles = () => (
    <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1c2027; }
        ::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #718096; }
    `}</style>
);

// App Logo Component, consistent with the host app
const AppLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 013.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 01-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.197-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.197a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.197.398a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

// A simple status card component for user feedback
const StatusCard = ({ icon: Icon, title, message, colorClass = 'text-sky-400' }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex flex-col items-center justify-center text-center p-8"
    >
        <Icon className={`w-24 h-24 mb-6 ${colorClass}`} />
        <h2 className="text-3xl font-bold text-slate-100 mb-2">{title}</h2>
        {message && <p className="text-slate-400 max-w-sm">{message}</p>}
    </motion.div>
);

// --- START: Improved QrScanner Component ---
const QrScanner = ({ onScanSuccess, onCancel, onError }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        // Create a new scanner instance and store it in the ref.
        // This will only happen once per component mount.
        scannerRef.current = new Html5Qrcode('qr-reader-container');
        const qrScanner = scannerRef.current;

        const successCallback = (decodedText) => {
            if (qrScanner?.isScanning) {
                qrScanner.stop()
                    .then(() => onScanSuccess(decodedText))
                    .catch(err => {
                        console.error("Error stopping scanner, but proceeding.", err);
                        onScanSuccess(decodedText);
                    });
            }
        };

        // Start scanning, preferring the back camera
        qrScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdge * 0.7);
                    return { width: qrboxSize, height: qrboxSize };
                },
            },
            successCallback,
            () => {} // Optional error callback, can be ignored
        ).catch(err => {
            onError("Gagal memulai kamera. Pastikan Anda telah memberikan izin akses kamera.");
        });

        // Cleanup function to stop the scanner when the component unmounts
        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(err => console.warn("QR Scanner stop error on cleanup:", err));
            }
        };
    // The empty dependency array ensures this effect runs only once on mount and cleanup on unmount.
    }, [onScanSuccess, onError]);

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Pindai Kode QR</h2>
            <p className="text-slate-400 mb-6">Arahkan kamera Anda ke kode QR di layar host.</p>
            <div className="w-full max-w-md overflow-hidden rounded-lg border-2 border-gray-700 bg-black shadow-lg">
                {/* This div is the target for the scanner */}
                <div id="qr-reader-container"></div>
            </div>
            <button
                onClick={onCancel}
                className="mt-8 font-semibold text-red-500 transition-colors hover:text-red-400"
            >
                Batal
            </button>
        </div>
    );
};
// --- END: Improved QrScanner Component ---


// Main Application Component
export default function App() {
    const [mode, setMode] = useState('idle'); // idle, scanning, connecting, connected, error
    const [connectionId, setConnectionId] = useState(null);
    const [error, setError] = useState(null);
    
    const pc = useRef(null);
    const keyRef = useRef(null);

    const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    // Function to clean up the connection state
    const resetState = () => {
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        setMode('idle');
        setConnectionId(null);
        setError(null);
        keyRef.current = null;
    };

    // This function is triggered after a successful QR scan
    const handleJoin = async (scannedData) => {
        setMode('connecting');
        if (scannedData) {
            try {
                const { connectionId: scannedId, key: exportedKey } = JSON.parse(scannedData);
                
                const connSnapshot = await get(ref(firebaseDb, `connections/${scannedId}`));
                if (!connSnapshot.exists()) {
                    throw new Error("ID Koneksi tidak ditemukan. Host mungkin telah terputus.");
                }
                if (connSnapshot.val().status === 'connected') {
                    throw new Error("Sesi ini sudah terhubung dengan klien lain.");
                }

                const importedKey = await cryptoHelper.importKey(exportedKey);
                keyRef.current = importedKey;
                await idb.setItem('clientEncryptionKey', importedKey);
                setConnectionId(scannedId);

                pc.current = new RTCPeerConnection(iceServers);

                const encryptedOffer = connSnapshot.val().offer;
                const offer = await cryptoHelper.decryptData(keyRef.current, encryptedOffer);
                await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);

                const encryptedAnswer = await cryptoHelper.encryptData(keyRef.current, { sdp: answer.sdp, type: answer.type });
                await set(ref(firebaseDb, `connections/${scannedId}/answer`), encryptedAnswer);

                onValue(ref(firebaseDb, `connections/${scannedId}/status`), (snapshot) => {
                    if (snapshot.val() === 'connected') {
                        setMode('connected');
                    }
                });

            } catch (e) {
                console.error("Error joining connection:", e);
                setError(e.message || "Kode QR tidak valid atau koneksi gagal.");
                setMode('error');
            }
        }
    };

    // Function to handle errors from the scanner component
    const handleScanError = (errorMessage) => {
        setError(errorMessage);
        setMode('error');
    };

    const renderContent = () => {
        switch (mode) {
            case 'scanning':
                // Render the improved QrScanner component
                return (
                    <QrScanner
                        onScanSuccess={handleJoin}
                        onCancel={resetState}
                        onError={handleScanError}
                    />
                );
            case 'connecting':
                return <StatusCard icon={Wifi} title="Menyambungkan..." message="Membuat koneksi peer-to-peer yang aman dengan host." colorClass="text-yellow-400 animate-pulse" />;
            case 'connected':
                return (
                    <div>
                        <StatusCard icon={CheckCircle} title="Koneksi Berhasil!" message={`Anda sekarang terhubung dengan aman ke host. ID Sesi: ${connectionId}`} colorClass="text-green-500" />
                        <div className="flex justify-center mt-4">
                           <button 
                                onClick={resetState} 
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
                            >
                                <WifiOff className="w-5 h-5" />
                                Putuskan Koneksi
                            </button>
                        </div>
                    </div>
                );
            case 'error':
                return (
                     <div>
                        <StatusCard icon={XCircle} title="Koneksi Gagal" message={error} colorClass="text-red-500" />
                        <div className="flex justify-center mt-4">
                           <button 
                                onClick={resetState} 
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col items-center text-center">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMode('scanning')}
                            className="bg-sky-600 text-white font-bold rounded-2xl p-8 shadow-lg hover:bg-sky-500 transition-all duration-300 flex flex-col items-center gap-4"
                        >
                            <Scan className="w-20 h-20" />
                            <span className="text-2xl">Mulai Pindai untuk Terhubung</span>
                        </motion.button>
                    </div>
                );
        }
    };

    return (
        <div className="bg-[#14171f] min-h-screen font-sans flex flex-col items-center justify-center p-4">
            <CustomScrollbarStyles />
            <header className="absolute top-0 left-0 w-full p-6 flex items-center gap-3">
                <AppLogo className="w-9 h-9 text-sky-400"/>
                <h1 className="text-xl font-bold text-white">Sapientia <span className="font-light text-slate-400">Client</span></h1>
            </header>
            
            <main className="flex-grow flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={mode}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className="text-slate-500 text-sm p-4">
                Secure P2P Connection Client
            </footer>
        </div>
    );
}
