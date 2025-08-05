# Dokumentasi RealtimeTextToSpeech untuk React.js

## Deskripsi
RealtimeTextToSpeech adalah modul JavaScript yang memungkinkan implementasi text-to-speech realtime dengan integrasi React state yang seamless. Modul ini dapat membaca teks secara otomatis saat state berubah tanpa pengulangan.

## Fitur Utama
- ✅ Realtime speech dari React state
- ✅ Kontrol pemutaran lengkap (play, pause, resume, stop)
- ✅ Kustomisasi suara, kecepatan, nada, dan volume
- ✅ Auto-detection perubahan state
- ✅ Event-driven architecture
- ✅ Tidak ada pengulangan speech
- ✅ Browser compatibility check

## Instalasi

### 1. Download Modul
Simpan kode RealtimeTextToSpeech ke dalam file `RealtimeTextToSpeech.js` di folder `src/utils/` atau `src/lib/`.

### 2. Import ke React Component
```javascript
import RealtimeTextToSpeech from '../utils/RealtimeTextToSpeech';
```

## Implementasi Dasar

### 1. Contoh Sederhana dengan React State

```jsx
import React, { useState, useEffect, useRef } from 'react';
import RealtimeTextToSpeech from '../utils/RealtimeTextToSpeech';

function SimpleTextToSpeech() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const ttsRef = useRef(null);

  useEffect(() => {
    // Inisialisasi TTS
    ttsRef.current = new RealtimeTextToSpeech({
      textSource: () => text, // Function yang mengembalikan state
      autoStart: true,
      changeDelay: 500,
      watchStateChanges: true,
      pollingInterval: 100
    });

    // Setup event listeners
    ttsRef.current.on('start', () => {
      setIsPlaying(true);
      console.log('Speech dimulai');
    });

    ttsRef.current.on('end', () => {
      setIsPlaying(false);
      console.log('Speech selesai');
    });

    // Cleanup saat component unmount
    return () => {
      ttsRef.current?.destroy();
    };
  }, []);

  // Update TTS saat text berubah
  useEffect(() => {
    if (ttsRef.current) {
      ttsRef.current.updateText(text);
    }
  }, [text]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Text to Speech</h2>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ketik teks di sini..."
        rows={4}
        cols={50}
        style={{ marginBottom: '10px' }}
      />
      
      <div>
        <button 
          onClick={() => ttsRef.current?.speak()}
          disabled={isPlaying}
        >
          Bicara
        </button>
        
        <button 
          onClick={() => ttsRef.current?.pause()}
          disabled={!isPlaying}
        >
          Jeda
        </button>
        
        <button 
          onClick={() => ttsRef.current?.resume()}
          disabled={!isPlaying}
        >
          Lanjut
        </button>
        
        <button 
          onClick={() => ttsRef.current?.stop()}
          disabled={!isPlaying}
        >
          Stop
        </button>
      </div>
      
      <p>Status: {isPlaying ? 'Sedang berbicara...' : 'Tidak aktif'}</p>
    </div>
  );
}

export default SimpleTextToSpeech;
```

### 2. Implementasi dengan Konfigurasi Lengkap

```jsx
import React, { useState, useEffect, useRef } from 'react';
import RealtimeTextToSpeech from '../utils/RealtimeTextToSpeech';

function AdvancedTextToSpeech() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [settings, setSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceIndex: 0
  });
  const [status, setStatus] = useState('idle');
  const ttsRef = useRef(null);

  useEffect(() => {
    // Cek browser support
    if (!RealtimeTextToSpeech.isSupported()) {
      alert('Browser tidak mendukung Web Speech API');
      return;
    }

    // Inisialisasi dengan konfigurasi lengkap
    ttsRef.current = new RealtimeTextToSpeech({
      textSource: () => text,
      autoStart: true,
      changeDelay: 300,
      watchStateChanges: true,
      pollingInterval: 50,
      defaultSettings: settings
    });

    // Setup semua event listeners
    ttsRef.current.on('start', (text) => {
      setStatus(`Berbicara: "${text.substring(0, 50)}..."`);
    });

    ttsRef.current.on('end', () => {
      setStatus('Selesai');
    });

    ttsRef.current.on('pause', () => {
      setStatus('Dijeda');
    });

    ttsRef.current.on('resume', () => {
      setStatus('Dilanjutkan');
    });

    ttsRef.current.on('stop', () => {
      setStatus('Dihentikan');
    });

    ttsRef.current.on('error', (error) => {
      setStatus(`Error: ${error.message}`);
    });

    ttsRef.current.on('voicesLoaded', (loadedVoices) => {
      setVoices(loadedVoices);
      
      // Auto-select Indonesian voice
      const indonesianIndex = ttsRef.current.selectBestIndonesianVoice();
      if (indonesianIndex >= 0) {
        setSettings(prev => ({ ...prev, voiceIndex: indonesianIndex }));
      }
    });

    ttsRef.current.on('textChange', (newText) => {
      console.log('Text berubah:', newText);
    });

    return () => {
      ttsRef.current?.destroy();
    };
  }, []);

  // Update settings saat berubah
  useEffect(() => {
    if (ttsRef.current) {
      ttsRef.current.setSettings(settings);
    }
  }, [settings]);

  // Update text
  useEffect(() => {
    if (ttsRef.current) {
      ttsRef.current.updateText(text);
    }
  }, [text]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Advanced Text to Speech</h2>
      
      {/* Text Input */}
      <div style={{ marginBottom: '20px' }}>
        <label>Teks:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik teks yang ingin diucapkan..."
          rows={6}
          style={{ width: '100%', marginTop: '5px' }}
        />
      </div>

      {/* Voice Settings */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Pengaturan Suara</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Suara: </label>
          <select 
            value={settings.voiceIndex}
            onChange={(e) => handleSettingChange('voiceIndex', e.target.value)}
          >
            {voices.map((voice, index) => (
              <option key={index} value={index}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Kecepatan: {settings.rate}</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={settings.rate}
            onChange={(e) => handleSettingChange('rate', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Nada: {settings.pitch}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => handleSettingChange('pitch', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Volume: {settings.volume}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => handleSettingChange('volume', e.target.value)}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => ttsRef.current?.speak()}
          style={{ marginRight: '10px' }}
        >
          Bicara
        </button>
        
        <button 
          onClick={() => ttsRef.current?.pause()}
          style={{ marginRight: '10px' }}
        >
          Jeda
        </button>
        
        <button 
          onClick={() => ttsRef.current?.resume()}
          style={{ marginRight: '10px' }}
        >
          Lanjut
        </button>
        
        <button 
          onClick={() => ttsRef.current?.stop()}
          style={{ marginRight: '10px' }}
        >
          Stop
        </button>
        
        <button 
          onClick={() => ttsRef.current?.reset()}
        >
          Reset
        </button>
      </div>

      {/* Status */}
      <div>
        <strong>Status:</strong> {status}
        <br />
        <strong>Estimasi Durasi:</strong> {ttsRef.current?.estimateDuration(text) || 0} detik
      </div>
    </div>
  );
}

export default AdvancedTextToSpeech;
```

## Konfigurasi Dasar

### Parameter Constructor

```javascript
const tts = new RealtimeTextToSpeech({
  // Sumber teks
  textSource: () => reactState,        // Function yang mengembalikan text
  textInput: inputElement,             // HTML input element (opsional)
  
  // Mode realtime
  autoStart: true,                     // Auto start saat text berubah
  changeDelay: 500,                    // Delay setelah text berubah (ms)
  
  // State watching
  watchStateChanges: true,             // Monitor perubahan state
  pollingInterval: 100,                // Interval polling (ms)
  
  // Pengaturan default
  defaultSettings: {
    rate: 1.0,                         // Kecepatan (0.1 - 10)
    pitch: 1.0,                        // Nada (0 - 2)
    volume: 1.0,                       // Volume (0 - 1)
    voiceIndex: 0                      // Index suara
  }
});
```

### Method Utama

```javascript
// Text management
tts.setTextSource(() => state);        // Set sumber text
tts.updateText(newText);               // Update text manual
tts.getText();                         // Get current text

// Playback control
tts.speak();                           // Mulai berbicara
tts.pause();                           // Jeda
tts.resume();                          // Lanjut
tts.stop();                            // Stop
tts.reset();                           // Reset ke awal

// Settings
tts.setSettings({ rate: 1.5 });        // Update pengaturan
tts.getSettings();                     // Get pengaturan saat ini
tts.getVoices();                       // Get daftar suara

// State management
tts.startWatching();                   // Mulai monitoring state
tts.stopWatching();                    // Stop monitoring
tts.getState();                        // Get state saat ini

// Utility
tts.estimateDuration(text);            // Estimasi durasi
tts.selectBestIndonesianVoice();       // Auto-select suara Indonesia
tts.destroy();                         // Cleanup
```

### Event Handling

```javascript
tts.on('start', (text) => {
  console.log('Speech dimulai:', text);
});

tts.on('end', (text) => {
  console.log('Speech selesai:', text);
});

tts.on('pause', (text) => {
  console.log('Speech dijeda:', text);
});

tts.on('resume', (text) => {
  console.log('Speech dilanjutkan:', text);
});

tts.on('stop', () => {
  console.log('Speech dihentikan');
});

tts.on('error', (error) => {
  console.error('Error:', error);
});

tts.on('textChange', (newText) => {
  console.log('Text berubah:', newText);
});

tts.on('voicesLoaded', (voices) => {
  console.log('Suara tersedia:', voices);
});
```

## Hook Custom untuk React

```jsx
import { useEffect, useRef, useState } from 'react';
import RealtimeTextToSpeech from '../utils/RealtimeTextToSpeech';

function useTextToSpeech(text, options = {}) {
  const ttsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (!RealtimeTextToSpeech.isSupported()) {
      console.warn('Browser tidak mendukung Web Speech API');
      return;
    }

    ttsRef.current = new RealtimeTextToSpeech({
      textSource: () => text,
      autoStart: true,
      ...options
    });

    // Setup events
    ttsRef.current.on('start', () => setIsPlaying(true));
    ttsRef.current.on('end', () => {
      setIsPlaying(false);
      setIsPaused(false);
    });
    ttsRef.current.on('pause', () => setIsPaused(true));
    ttsRef.current.on('resume', () => setIsPaused(false));
    ttsRef.current.on('stop', () => {
      setIsPlaying(false);
      setIsPaused(false);
    });
    ttsRef.current.on('voicesLoaded', setVoices);

    return () => {
      ttsRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (ttsRef.current) {
      ttsRef.current.updateText(text);
    }
  }, [text]);

  return {
    speak: () => ttsRef.current?.speak(),
    pause: () => ttsRef.current?.pause(),
    resume: () => ttsRef.current?.resume(),
    stop: () => ttsRef.current?.stop(),
    reset: () => ttsRef.current?.reset(),
    setSettings: (settings) => ttsRef.current?.setSettings(settings),
    isPlaying,
    isPaused,
    voices,
    tts: ttsRef.current
  };
}

// Penggunaan hook
function MyComponent() {
  const [text, setText] = useState('');
  const { speak, pause, resume, stop, isPlaying, voices } = useTextToSpeech(text);

  return (
    <div>
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
      />
      <button onClick={speak}>Bicara</button>
      <button onClick={pause}>Jeda</button>
      <button onClick={resume}>Lanjut</button>
      <button onClick={stop}>Stop</button>
      <p>Status: {isPlaying ? 'Berbicara' : 'Diam'}</p>
    </div>
  );
}
```

## Tips Penggunaan

### 1. Browser Compatibility
```javascript
// Selalu cek support browser
if (!RealtimeTextToSpeech.isSupported()) {
  // Tampilkan pesan atau gunakan fallback
  return <div>Browser tidak mendukung Text-to-Speech</div>;
}
```

### 2. Performance Optimization
```javascript
// Gunakan debouncing untuk input yang cepat berubah
const tts = new RealtimeTextToSpeech({
  changeDelay: 1000,  // Tunggu 1 detik setelah perubahan
  pollingInterval: 200 // Polling lebih jarang
});
```

### 3. Memory Management
```javascript
// Selalu cleanup di useEffect
useEffect(() => {
  // ... setup TTS
  
  return () => {
    ttsRef.current?.destroy(); // Penting untuk cleanup
  };
}, []);
```

### 4. Error Handling
```javascript
tts.on('error', (error) => {
  console.error('TTS Error:', error);
  // Handle error, mungkin tampilkan notifikasi
  setErrorMessage('Gagal memulai text-to-speech');
});
```

## Contoh Penggunaan Lanjutan

### Real-time Chat dengan TTS
```jsx
function ChatWithTTS() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const { speak } = useTextToSpeech(
    messages.length > 0 ? messages[messages.length - 1].text : '',
    { autoStart: true }
  );

  const addMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: newMessage,
        timestamp: new Date()
      }]);
      setNewMessage('');
    }
  };

  return (
    <div>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>{msg.text}</div>
        ))}
      </div>
      <input 
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addMessage()}
      />
      <button onClick={addMessage}>Kirim</button>
    </div>
  );
}
```

Dokumentasi ini memberikan panduan lengkap untuk mengimplementasikan RealtimeTextToSpeech di React.js dengan berbagai tingkat kompleksitas, dari yang sederhana hingga yang advanced.