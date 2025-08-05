/**
 * RealtimeTextToSpeech Module - Enhanced for React State Management
 * 
 * Module JavaScript untuk Text-to-Speech realtime dengan kemampuan:
 * - Realtime speech dari berbagai sumber (input, state, variabel)
 * - React state integration
 * - Kontrol pemutaran (play, pause, resume, stop)
 * - Kustomisasi suara, kecepatan, nada, dan volume
 * - Event-driven architecture
 * - Tidak ada pengulangan speech
 * - Automatic state change detection
 * 
 * @version 2.0.0
 * @author Assistant
 */

class RealtimeTextToSpeech {
    /**
     * Constructor untuk RealtimeTextToSpeech
     * @param {Object} options - Konfigurasi awal
     * @param {HTMLElement} options.textInput - Element input teks (opsional)
     * @param {Function} options.textSource - Function yang mengembalikan text (untuk React state)
     * @param {boolean} options.autoStart - Auto start saat text berubah (default: true)
     * @param {number} options.changeDelay - Delay setelah text berubah dalam ms (default: 500)
     * @param {boolean} options.watchStateChanges - Monitor perubahan state (default: false)
     * @param {number} options.pollingInterval - Interval polling untuk state changes dalam ms (default: 100)
     * @param {Object} options.defaultSettings - Pengaturan default
     */
    constructor(options = {}) {
        // Validasi Web Speech API
        if (!('speechSynthesis' in window)) {
            throw new Error('Browser tidak mendukung Web Speech API');
        }

        // Konfigurasi default
        this.config = {
            autoStart: true,
            changeDelay: 500,
            watchStateChanges: false,
            pollingInterval: 100,
            defaultSettings: {
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                voiceIndex: 0
            },
            ...options
        };

        // Text sources
        this.textInput = options.textInput || null;
        this.textSource = options.textSource || null;
        this.currentTextSource = '';

        // Web Speech API
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;

        // State management
        this.state = {
            isPlaying: false,
            isPaused: false,
            lastSpokenIndex: 0,
            lastTextLength: 0,
            currentText: '',
            lastSourceText: ''
        };

        // Settings
        this.settings = { ...this.config.defaultSettings };

        // Timers
        this.changeTimer = null;
        this.stateWatcher = null;

        // Event callbacks
        this.callbacks = {
            onStart: null,
            onEnd: null,
            onPause: null,
            onResume: null,
            onStop: null,
            onError: null,
            onProgress: null,
            onVoicesLoaded: null,
            onTextChange: null
        };

        // Inisialisasi
        this.init();
    }

    /**
     * Inisialisasi module
     * @private
     */
    init() {
        this.loadVoices();
        this.setupEventListeners();

        // Load voices saat ready
        this.synthesis.addEventListener('voiceschanged', () => {
            this.loadVoices();
        });

        // Start state watching jika diminta
        if (this.config.watchStateChanges) {
            this.startStateWatching();
        }
    }

    /**
     * Load daftar suara yang tersedia
     * @private
     */
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // Trigger callback jika ada
        if (this.callbacks.onVoicesLoaded) {
            this.callbacks.onVoicesLoaded(this.voices);
        }
    }

    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        // Setup untuk textInput jika ada
        if (this.config.autoStart && this.textInput) {
            this.textInput.addEventListener('input', () => {
                this.handleTextChange();
            });
        }
    }

    /**
     * Start watching state changes
     * @private
     */
    startStateWatching() {
        if (this.stateWatcher) return;

        this.stateWatcher = setInterval(() => {
            this.checkForStateChanges();
        }, this.config.pollingInterval);
    }

    /**
     * Stop watching state changes
     * @private
     */
    stopStateWatching() {
        if (this.stateWatcher) {
            clearInterval(this.stateWatcher);
            this.stateWatcher = null;
        }
    }

    /**
     * Check for state changes
     * @private
     */
    checkForStateChanges() {
        const currentText = this.getCurrentText();
        
        if (currentText !== this.state.lastSourceText) {
            this.state.lastSourceText = currentText;
            
            if (this.callbacks.onTextChange) {
                this.callbacks.onTextChange(currentText);
            }
            
            if (this.config.autoStart) {
                this.handleTextChange();
            }
        }
    }

    /**
     * Get current text from various sources
     * @private
     * @returns {string} Current text
     */
    getCurrentText() {
        if (this.textSource && typeof this.textSource === 'function') {
            return this.textSource() || '';
        } else if (this.textInput) {
            return this.textInput.value || '';
        } else if (this.currentTextSource) {
            return this.currentTextSource;
        }
        return '';
    }

    /**
     * Handle text change dari berbagai sumber
     * @private
     */
    handleTextChange() {
        const currentText = this.getCurrentText().trim();
        
        // Clear timer sebelumnya
        if (this.changeTimer) {
            clearTimeout(this.changeTimer);
        }

        // Tunggu setelah text berubah
        this.changeTimer = setTimeout(() => {
            if (currentText.length > this.state.lastTextLength && currentText.length > 0) {
                if (!this.state.isPlaying) {
                    this.startRealtimeSpeaking(currentText);
                } else {
                    // Update ongoing speech dengan text baru
                    this.updateOngoingSpeech(currentText);
                }
            }
            this.state.lastTextLength = currentText.length;
        }, this.config.changeDelay);
    }

    /**
     * Update ongoing speech dengan text baru
     * @private
     * @param {string} newText - Text baru
     */
    updateOngoingSpeech(newText) {
        const unspokenText = newText.substring(this.state.lastSpokenIndex);
        
        if (unspokenText.trim().length > 0) {
            // Hentikan speech saat ini dan lanjutkan dengan text baru
            this.synthesis.cancel();
            
            setTimeout(() => {
                this.startRealtimeSpeaking(newText);
            }, 50);
        }
    }

    /**
     * Mulai berbicara dalam mode realtime
     * @private
     * @param {string} text - Teks yang akan diucapkan
     */
    startRealtimeSpeaking(text) {
        if (!text) return;

        // Hentikan speech yang sedang berjalan
        this.synthesis.cancel();

        // Ambil bagian teks yang belum diucapkan
        const textToSpeak = text.substring(this.state.lastSpokenIndex);
        if (textToSpeak.trim().length === 0) return;

        this.speakText(textToSpeak, true);
    }

    /**
     * Fungsi utama untuk berbicara
     * @param {string} text - Teks yang akan diucapkan
     * @param {boolean} isRealtime - Apakah dalam mode realtime
     * @returns {Promise} Promise yang resolve saat selesai
     */
    speakText(text, isRealtime = false) {
        return new Promise((resolve, reject) => {
            if (!text.trim()) {
                reject(new Error('Teks tidak boleh kosong'));
                return;
            }

            // Buat utterance baru
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            this.state.currentText = text;

            // Set properti suara
            this.applySettings();

            // Event handlers
            this.currentUtterance.onstart = () => {
                this.state.isPlaying = true;
                this.state.isPaused = false;
                
                if (this.callbacks.onStart) {
                    this.callbacks.onStart(text);
                }
            };

            this.currentUtterance.onend = () => {
                this.state.isPlaying = false;
                this.state.isPaused = false;
                
                if (isRealtime) {
                    this.state.lastSpokenIndex += text.length;
                    
                    // Cek apakah ada teks baru
                    const currentText = this.getCurrentText();
                    const remainingText = currentText.substring(this.state.lastSpokenIndex);
                    
                    if (remainingText.trim().length > 0) {
                        setTimeout(() => {
                            this.startRealtimeSpeaking(currentText);
                        }, 100);
                    } else {
                        if (this.callbacks.onEnd) {
                            this.callbacks.onEnd(text);
                        }
                        resolve(text);
                    }
                } else {
                    if (this.callbacks.onEnd) {
                        this.callbacks.onEnd(text);
                    }
                    resolve(text);
                }
            };

            this.currentUtterance.onerror = (event) => {
                this.state.isPlaying = false;
                this.state.isPaused = false;
                
                if (this.callbacks.onError) {
                    this.callbacks.onError(event);
                }
                reject(event);
            };

            this.currentUtterance.onpause = () => {
                this.state.isPaused = true;
                
                if (this.callbacks.onPause) {
                    this.callbacks.onPause(text);
                }
            };

            this.currentUtterance.onresume = () => {
                this.state.isPaused = false;
                
                if (this.callbacks.onResume) {
                    this.callbacks.onResume(text);
                }
            };

            // Mulai berbicara
            this.synthesis.speak(this.currentUtterance);
        });
    }

    /**
     * Apply pengaturan ke utterance
     * @private
     */
    applySettings() {
        if (!this.currentUtterance) return;

        // Set voice
        if (this.voices[this.settings.voiceIndex]) {
            this.currentUtterance.voice = this.voices[this.settings.voiceIndex];
        }

        // Set properties
        this.currentUtterance.rate = this.settings.rate;
        this.currentUtterance.pitch = this.settings.pitch;
        this.currentUtterance.volume = this.settings.volume;
    }

    // ========== PUBLIC METHODS ==========

    /**
     * Set text source untuk React state atau variabel lain
     * @param {Function|string} source - Function yang mengembalikan text atau string langsung
     */
    setTextSource(source) {
        if (typeof source === 'function') {
            this.textSource = source;
        } else if (typeof source === 'string') {
            this.currentTextSource = source;
        } else {
            throw new Error('Text source harus berupa function atau string');
        }

        // Update state terakhir
        this.state.lastSourceText = this.getCurrentText();
    }

    /**
     * Update text secara manual (untuk React state changes)
     * @param {string} newText - Text baru
     */
    updateText(newText) {
        this.currentTextSource = newText || '';
        
        if (this.callbacks.onTextChange) {
            this.callbacks.onTextChange(newText);
        }
        
        if (this.config.autoStart) {
            this.handleTextChange();
        }
    }

    /**
     * Start state watching
     */
    startWatching() {
        this.config.watchStateChanges = true;
        this.startStateWatching();
    }

    /**
     * Stop state watching
     */
    stopWatching() {
        this.config.watchStateChanges = false;
        this.stopStateWatching();
    }

    /**
     * Mulai berbicara dengan teks tertentu
     * @param {string} text - Teks yang akan diucapkan (opsional)
     * @returns {Promise} Promise yang resolve saat selesai
     */
    async speak(text) {
        if (!text) {
            text = this.getCurrentText();
        }
        
        if (!text) {
            throw new Error('Teks tidak boleh kosong');
        }

        this.state.lastSpokenIndex = 0;
        return this.speakText(text);
    }

    /**
     * Jeda pembicaraan
     */
    pause() {
        if (this.state.isPlaying && !this.state.isPaused) {
            this.synthesis.pause();
        }
    }

    /**
     * Lanjutkan pembicaraan
     */
    resume() {
        if (this.state.isPlaying && this.state.isPaused) {
            this.synthesis.resume();
        }
    }

    /**
     * Berhenti berbicara
     */
    stop() {
        this.synthesis.cancel();
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.lastSpokenIndex = 0;
        
        if (this.callbacks.onStop) {
            this.callbacks.onStop();
        }
    }

    /**
     * Set pengaturan suara
     * @param {Object} settings - Pengaturan baru
     * @param {number} settings.rate - Kecepatan (0.1 - 10)
     * @param {number} settings.pitch - Nada (0 - 2)
     * @param {number} settings.volume - Volume (0 - 1)
     * @param {number} settings.voiceIndex - Index suara
     */
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }

    /**
     * Get pengaturan saat ini
     * @returns {Object} Pengaturan saat ini
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get daftar suara yang tersedia
     * @returns {Array} Daftar suara
     */
    getVoices() {
        return this.voices;
    }

    /**
     * Get state saat ini
     * @returns {Object} State saat ini
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get current text dari semua sumber
     * @returns {string} Current text
     */
    getText() {
        return this.getCurrentText();
    }

    /**
     * Set callback untuk event tertentu
     * @param {string} event - Nama event
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        const eventKey = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
        if (this.callbacks.hasOwnProperty(eventKey)) {
            this.callbacks[eventKey] = callback;
        }
    }

    /**
     * Enable/disable mode realtime
     * @param {boolean} enabled - Enable atau disable
     */
    setRealtimeMode(enabled) {
        this.config.autoStart = enabled;
        
        if (enabled && this.textInput) {
            this.setupEventListeners();
        }
    }

    /**
     * Set change delay
     * @param {number} delay - Delay dalam milliseconds
     */
    setChangeDelay(delay) {
        this.config.changeDelay = delay;
    }

    /**
     * Set polling interval untuk state watching
     * @param {number} interval - Interval dalam milliseconds
     */
    setPollingInterval(interval) {
        this.config.pollingInterval = interval;
        
        if (this.config.watchStateChanges) {
            this.stopStateWatching();
            this.startStateWatching();
        }
    }

    /**
     * Reset ke kondisi awal
     */
    reset() {
        this.stop();
        this.state.lastSpokenIndex = 0;
        this.state.lastTextLength = 0;
        this.state.currentText = '';
        this.state.lastSourceText = '';
        
        if (this.changeTimer) {
            clearTimeout(this.changeTimer);
            this.changeTimer = null;
        }
    }

    /**
     * Destroy instance dan cleanup
     */
    destroy() {
        this.stop();
        this.stopStateWatching();
        
        if (this.changeTimer) {
            clearTimeout(this.changeTimer);
        }

        // Clear callbacks
        Object.keys(this.callbacks).forEach(key => {
            this.callbacks[key] = null;
        });

        // Remove event listeners
        if (this.textInput) {
            this.textInput.removeEventListener('input', this.handleTextChange);
        }
    }

    // ========== UTILITY METHODS ==========

    /**
     * Cek apakah browser mendukung Web Speech API
     * @static
     * @returns {boolean} True jika didukung
     */
    static isSupported() {
        return 'speechSynthesis' in window;
    }

    /**
     * Get suara Indonesia yang tersedia
     * @returns {Array} Daftar suara Indonesia
     */
    getIndonesianVoices() {
        return this.voices.filter(voice => 
            voice.lang.startsWith('id') || 
            voice.name.toLowerCase().includes('indonesia')
        );
    }

    /**
     * Auto-select suara Indonesia terbaik
     */
    selectBestIndonesianVoice() {
        const indonesianVoices = this.getIndonesianVoices();
        if (indonesianVoices.length > 0) {
            const voiceIndex = this.voices.indexOf(indonesianVoices[0]);
            this.setSettings({ voiceIndex });
            return voiceIndex;
        }
        return -1;
    }

    /**
     * Estimasi durasi pembicaraan dalam detik
     * @param {string} text - Teks yang akan dianalisis
     * @returns {number} Estimasi durasi dalam detik
     */
    estimateDuration(text) {
        if (!text) return 0;
        
        // Estimasi berdasarkan jumlah karakter dan rate
        // Rata-rata 5 karakter per detik untuk rate 1.0
        const baseRate = 5;
        const adjustedRate = baseRate * this.settings.rate;
        return Math.ceil(text.length / adjustedRate);
    }

    /**
     * Force check untuk perubahan state (manual trigger)
     */
    forceCheck() {
        this.checkForStateChanges();
    }

    /**
     * Bind ke React component untuk auto cleanup
     * @param {Object} component - React component instance
     */
    bindToReactComponent(component) {
        const originalComponentWillUnmount = component.componentWillUnmount;
        
        component.componentWillUnmount = () => {
            this.destroy();
            if (originalComponentWillUnmount) {
                originalComponentWillUnmount.call(component);
            }
        };
    }
}

// Export untuk berbagai environment
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = RealtimeTextToSpeech;
} else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function() {
        return RealtimeTextToSpeech;
    });
} else {
    // Browser global
    window.RealtimeTextToSpeech = RealtimeTextToSpeech;
}