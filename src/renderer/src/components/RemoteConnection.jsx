import { ref, set, onValue, remove, get } from "firebase/database";
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
    QrCode,
    Scan,
    CheckCircle,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cryptoHelper } from '../lib/cryptoHelper';
import { idb } from '../lib/idbHelper';
import { firebaseDb } from '../lib/funFirebase';
import { ConnectionCard } from './ConnectionCard'; 
import '../../assets/xterm.css';
import '../../assets/output.css';

export function RemoteConnection() {
    const [mode, setMode] = useState(null);
    const [connectionId, setConnectionId] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [error, setError] = useState(null);
    
    const pc = useRef(null);
    const keyRef = useRef(null);
    const qrScannerRef = useRef(null);

    const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const resetState = () => {
        if (pc.current) { pc.current.close(); pc.current = null; }
        if (qrScannerRef.current) { qrScannerRef.current.stop().catch(err => {}); qrScannerRef.current = null; }
        if (connectionId) { remove(ref(firebaseDb, `connections/${connectionId}`)); }
        setMode(null); setConnectionId(null); setQrData(null); setError(null);
    };

    const createConnection = async () => {
        try {
            setMode('creating');
            let appKey = await idb.getItem('encryptionKey');
            if (!appKey) { appKey = await cryptoHelper.createKey(); await idb.setItem('encryptionKey', appKey); }
            keyRef.current = appKey;
            
            pc.current = new RTCPeerConnection(iceServers);
            
            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            
            const newConnectionId = `conn-${Date.now()}`;
            setConnectionId(newConnectionId);

            pc.current.onicecandidate = async (event) => {
                if (event.candidate) {
                    const encryptedCandidate = await cryptoHelper.encryptData(keyRef.current, event.candidate.toJSON());
                    set(ref(firebaseDb, `connections/${newConnectionId}/hostCandidates/${event.candidate.sdpMid}-${event.candidate.sdpMLineIndex}`), encryptedCandidate);
                }
            };

            const encryptedOffer = await cryptoHelper.encryptData(keyRef.current, { sdp: offer.sdp, type: offer.type });
            await set(ref(firebaseDb, `connections/${newConnectionId}`), { offer: encryptedOffer, status: 'waiting' });
            
            const exportedKey = await cryptoHelper.exportKey(keyRef.current);
            setQrData(JSON.stringify({ connectionId: newConnectionId, key: exportedKey }));

            onValue(ref(firebaseDb, `connections/${newConnectionId}/answer`), async (snapshot) => {
                if (snapshot.exists() && pc.current && pc.current.signalingState !== 'stable') {
                    const encryptedAnswer = snapshot.val();
                    const answer = await cryptoHelper.decryptData(keyRef.current, encryptedAnswer);
                    await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
                    set(ref(firebaseDb, `connections/${newConnectionId}/status`), 'connected');
                    setMode('connected');
                }
            });

        } catch (e) { console.error("Error creating connection:", e); setError("Gagal membuat koneksi."); resetState(); }
    };
    
    useEffect(() => {
        if (mode === 'joining' && !qrScannerRef.current) {
            const qrScanner = new Html5Qrcode('qr-reader-container');
            qrScannerRef.current = qrScanner;
            const onScanSuccess = (decodedText) => { qrScanner.stop(); handleJoin(decodedText); };
            qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {}).catch(err => setError("Gagal memulai kamera."));
        }
        return () => { if (qrScannerRef.current) { qrScannerRef.current.stop().catch(err => {}); qrScannerRef.current = null; } };
    }, [mode]);

    const handleJoin = async (scannedData) => {
        if (scannedData) {
            try {
                const { connectionId: scannedId, key: exportedKey } = JSON.parse(scannedData);
                const connSnapshot = await get(ref(firebaseDb, `connections/${scannedId}`));
                if (!connSnapshot.exists() || connSnapshot.val().status === 'connected') { setError("Koneksi tidak valid atau sudah penuh."); setTimeout(() => setMode(null), 3000); return; }
                const importedKey = await cryptoHelper.importKey(exportedKey);
                keyRef.current = importedKey;
                await idb.setItem('encryptionKey', importedKey);
                setConnectionId(scannedId);
                pc.current = new RTCPeerConnection(iceServers);
                const encryptedOffer = connSnapshot.val().offer;
                const offer = await cryptoHelper.decryptData(keyRef.current, encryptedOffer);
                await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                const encryptedAnswer = await cryptoHelper.encryptData(keyRef.current, { sdp: answer.sdp, type: answer.type });
                await set(ref(firebaseDb, `connections/${scannedId}/answer`), encryptedAnswer);
                setMode('connected');
            } catch (e) { console.error("Error joining connection:", e); setError("QR Code tidak valid."); setTimeout(() => setMode(null), 3000); }
        }
    };
    
    if (mode === 'creating') return <div className="flex flex-col items-center justify-center h-full text-center p-6"><h2 className="text-3xl font-bold text-slate-100 mb-4">Buat Koneksi</h2>{qrData ? <><p className="text-slate-400 mb-6">Pindai QR code ini.</p><div className="bg-white p-4 rounded-lg"><QRCodeSVG value={qrData} size={256} /></div><p className="font-mono text-sm text-slate-500 mt-4">ID: {connectionId}</p><div className="mt-6 flex items-center gap-2 text-yellow-400"><Wifi className="w-5 h-5 animate-pulse" /><span>Menunggu koneksi...</span></div></> : <p>Membuat koneksi...</p>}<button onClick={resetState} className="mt-8 text-red-500 hover:text-red-400">Batalkan</button></div>;
    if (mode === 'joining') return <div className="flex flex-col items-center justify-center h-full text-center p-6"><h2 className="text-3xl font-bold text-slate-100 mb-4">Pindai QR Code</h2><div id="qr-reader-container" className="w-full max-w-md h-auto rounded-lg overflow-hidden border border-gray-700"></div>{error && <p className="mt-4 text-red-500">{error}</p>}<button onClick={resetState} className="mt-8 text-red-500 hover:text-red-400">Batalkan</button></div>;
    if (mode === 'connected') return <div className="flex flex-col items-center justify-center h-full text-center p-6"><CheckCircle className="w-24 h-24 text-green-500 mb-6" /><h2 className="text-3xl font-bold text-slate-100 mb-2">Terhubung!</h2><p className="text-slate-400">Koneksi P2P berhasil dibuat.</p><p className="font-mono text-sm text-slate-500 mt-2">ID Sesi: {connectionId}</p><button onClick={resetState} className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2"><WifiOff className="w-5 h-5" />Putuskan Koneksi</button></div>;

    return <div className="flex flex-col items-center justify-center h-full text-center p-6"><h1 className="text-4xl font-bold text-slate-100 mb-2">Remote Connection</h1><p className="text-slate-400 mb-12 max-w-2xl">Buat atau gabung ke sesi P2P yang aman untuk menghubungkan perangkat.</p><div className="flex flex-col md:flex-row gap-8"><ConnectionCard icon={QrCode} title="Buat Koneksi" description="Menjadi host dan buat QR code." onClick={createConnection} /><ConnectionCard icon={Scan} title="Gabung ke Koneksi" description="Gunakan kamera untuk memindai QR code." onClick={() => setMode('joining')} /></div>{error && <p className="mt-8 text-red-500">{error}</p>}</div>;
}
// --- END: Komponen Remote Connection ---