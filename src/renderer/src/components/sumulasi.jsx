import React, { useState, useEffect, useRef } from 'react';

// ==================================================================
// BAGIAN 1: FUNGSI-FUNGSI HELPER UNTUK TEXT-TO-SPEECH
// ==================================================================
function textToSpeech({ text, lang = 'id-ID', rate = 1.0, pitch = 1.0, onStart, onEnd, onError }) {
    if (!('speechSynthesis' in window)) {
        if (onError) onError({ error: 'Browser tidak mendukung Web Speech API.' });
        return;
    }
    if (!text || text.trim() === '') {
        if (onError) onError({ error: 'Tidak ada teks yang diberikan.' });
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;
    window.speechSynthesis.speak(utterance);
}

function speakAndWait(options) {
    return new Promise((resolve, reject) => {
        textToSpeech({ ...options, onEnd: () => resolve(), onError: (event) => reject(event.error) });
    });
}

// ==================================================================
// BAGIAN 2: KOMPONEN UTAMA APLIKASI
// ==================================================================
export default function App() {
  const [rawData, setRawData] = useState(`{
    "answer": "Kaito adalah seorang pembuat jam tua yang penyendiri. Tokonya adalah sebuah simfoni dari detak dan lonceng yang tak pernah berhenti. Setiap jam yang ia ciptakan menyimpan sepotong jiwanya. Suatu hari, seorang gadis kecil bernama Hana masuk ke dalam tokonya. Dia tidak datang untuk membeli, melainkan hanya untuk mengamati. Hana terpesona oleh roda gigi dan pegas yang rumit. Kaito melihat percikan api rasa ingin tahu di matanya. Ia memutuskan untuk mengajarinya keahliannya."
}`);

  const [rawStreamOutput, setRawStreamOutput] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [phrasesQueue, setPhrasesQueue] = useState([]);
  
  const [rawProgress, setRawProgress] = useState(0);
  const [textProgress, setTextProgress] = useState(0);
  const [phraseProgress, setPhraseProgress] = useState(0);
  
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentlySpeakingPhrase, setCurrentlySpeakingPhrase] = useState('');

  const intervalRef = useRef(null);
  const phrasePointer = useRef(0);

  const handleStartSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    window.speechSynthesis.cancel();

    setIsSimulating(true);
    setRawStreamOutput('');
    setDisplayedText('');
    setPhrasesQueue([]);
    setRawProgress(0);
    setTextProgress(0);
    setPhraseProgress(0);
    phrasePointer.current = 0;
    setIsSpeaking(false);
    setCurrentlySpeakingPhrase('');
  };

  useEffect(() => {
    if (!isSimulating) return;

    const answerKey = '"answer": "';
    const fullRawText = rawData;
    const totalRawLength = fullRawText.length;
    let currentIndex = 0;

    intervalRef.current = setInterval(() => {
      if (currentIndex >= totalRawLength) {
        clearInterval(intervalRef.current);
        const remainingText = displayedText.substring(phrasePointer.current).trim();
        if (remainingText) {
            setPhrasesQueue(prev => [...prev, remainingText]);
        }
        setIsSimulating(false);
        return;
      }

      // 1. Update Raw Stream
      currentIndex = Math.min(currentIndex + 4, totalRawLength);
      const currentRawStream = fullRawText.substring(0, currentIndex);
      setRawStreamOutput(currentRawStream);
      setRawProgress((currentIndex / totalRawLength) * 100);

      // 2. Coba Ekstrak 'answer' dari Raw Stream
      let textToDisplay = '';
      const answerKeyIndex = currentRawStream.indexOf(answerKey);
      if (answerKeyIndex !== -1) {
        const textStartIndex = answerKeyIndex + answerKey.length;
        textToDisplay = currentRawStream.substring(textStartIndex);
        if (textToDisplay.lastIndexOf('"') !== -1) {
            textToDisplay = textToDisplay.substring(0, textToDisplay.lastIndexOf('"'));
        }
      }
      setDisplayedText(textToDisplay);
      
      // Hitung progress 'answer' hanya jika ada
      if (answerKeyIndex !== -1) {
        const parsedFull = parseRawData(rawData);
        if (parsedFull.isValid) {
            setTextProgress(Math.min(100, (textToDisplay.length / parsedFull.answer.length) * 100));
        }
      }

      // 3. Ekstrak Frasa dari 'answer' yang berhasil diekstrak
      if (textToDisplay.length > phrasePointer.current) {
        let lastProcessedIndex = phrasePointer.current;
        const newPhrasesFound = [];
        
        while (true) {
            const unprocessedChunk = textToDisplay.substring(lastProcessedIndex);
            const matchIndex = unprocessedChunk.search(/[.,!?]/);
            if (matchIndex === -1) break;
            const phraseEndIndex = lastProcessedIndex + matchIndex + 1;
            const newPhrase = textToDisplay.substring(lastProcessedIndex, phraseEndIndex).trim();
            if (newPhrase) newPhrasesFound.push(newPhrase);
            lastProcessedIndex = phraseEndIndex;
        }

        if (newPhrasesFound.length > 0) {
            setPhrasesQueue(prev => [...prev, ...newPhrasesFound]);
            phrasePointer.current = lastProcessedIndex;
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.speechSynthesis.cancel();
    };
  }, [isSimulating, rawData]);

  // Effect untuk memproses antrean TTS
  useEffect(() => {
    const processQueue = async () => {
        if (isSpeaking || !isTtsEnabled || phrasesQueue.length === 0) return;

        setIsSpeaking(true);
        const phraseToSpeak = phrasesQueue[0];
        setCurrentlySpeakingPhrase(phraseToSpeak);

        try {
            await speakAndWait({ text: phraseToSpeak });
        } catch (error) {
            console.warn("Speech error:", error);
        } finally {
            setPhrasesQueue(currentQueue => currentQueue.slice(1));
            setCurrentlySpeakingPhrase('');
            setIsSpeaking(false);
        }
    };
    processQueue();
  }, [phrasesQueue, isSpeaking, isTtsEnabled]);
  
  const parseRawData = (data) => {
    const answerKey = '"answer": "';
    const startIndex = data.indexOf(answerKey);
    if (startIndex === -1) return { isValid: false, answer: '' };
    const textStartIndex = startIndex + answerKey.length;
    const endIndex = data.lastIndexOf('"}');
    if (endIndex === -1 || endIndex < textStartIndex) return { isValid: false, answer: '' };
    const answer = data.substring(textStartIndex, endIndex);
    return { isValid: true, answer };
  };

  // Update progress frasa
  useEffect(() => {
    const parsed = parseRawData(rawData);
    if (!parsed.isValid) {
        setPhraseProgress(0);
        return;
    };
    const totalPhrases = (parsed.answer.match(/[.,!?]/g) || []).length + (parsed.answer.length > 0 ? 1 : 0);
    if (totalPhrases > 0) {
        const phrasesSpoken = totalPhrases - phrasesQueue.length;
        setPhraseProgress((phrasesSpoken / totalPhrases) * 100);
    }
  }, [phrasesQueue, rawData]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-cyan-400">Real-time Text & Speech</h1>
            <div className="flex gap-2">
                <button onClick={() => setIsTtsEnabled(prev => !prev)} className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${isTtsEnabled ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                    {isTtsEnabled ? 'Suara: ON' : 'Suara: OFF'}
                </button>
            </div>
        </div>

        <div>
            <label htmlFor="raw-data-input" className="block text-sm font-medium text-gray-300 mb-2">Input Data Mentah:</label>
            <textarea id="raw-data-input" rows="6" className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 transition" value={rawData} onChange={(e) => setRawData(e.target.value)} disabled={isSimulating} />
        </div>
        
        <button onClick={handleStartSimulation} disabled={isSimulating} className="w-full px-4 py-3 rounded-lg font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
            {isSimulating ? 'Sedang Berjalan...' : 'Mulai / Ulangi Simulasi'}
        </button>

        {/* Panel 1: Raw Stream */}
        <div className="space-y-2 pt-4 border-t border-gray-700">
          <div className="flex justify-between"><span className="font-medium text-gray-300">Progress Raw Stream</span><span className="text-sm text-gray-300">{Math.round(rawProgress)}%</span></div>
          <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${rawProgress}%` }}></div></div>
          <div className="bg-black bg-opacity-50 p-4 rounded-lg min-h-[80px] border border-gray-700 text-gray-400 text-xs"><p className="whitespace-pre-wrap">{rawStreamOutput}{isSimulating && <span className="animate-pulse">▋</span>}</p></div>
        </div>
        
        {/* Panel 2: Answer Text */}
        <div className="space-y-2">
          <div className="flex justify-between"><span className="font-medium text-gray-300">Progress Teks Jawaban</span><span className="text-sm text-gray-300">{Math.round(textProgress)}%</span></div>
          <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${textProgress}%` }}></div></div>
          <div className="bg-black bg-opacity-50 p-4 rounded-lg min-h-[80px] border border-gray-700"><p className="text-gray-200 whitespace-pre-wrap">{displayedText}</p></div>
        </div>

        {/* Panel 3: Phrases Queue */}
        <div className="space-y-2">
          <div className="flex justify-between"><span className="font-medium text-gray-300">Progress Pembacaan Frasa</span><span className="text-sm text-gray-300">{Math.round(phraseProgress)}%</span></div>
          <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${phraseProgress}%` }}></div></div>
          <div className="bg-black bg-opacity-50 p-4 rounded-lg min-h-[80px] border border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Antrean Frasa untuk Dibaca:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  {phrasesQueue.map((phrase, index) => (<li key={index} className={currentlySpeakingPhrase === phrase ? 'text-cyan-400 font-bold' : ''}>{phrase}</li>))}
              </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
