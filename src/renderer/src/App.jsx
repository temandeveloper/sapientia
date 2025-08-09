import React, { useEffect, useState, useRef } from 'react';
import { CustomScrollbarStyles } from './layouts/CustomScrollbarStyles';
import { Sidebar } from './layouts/Sidebar';
import { MainContent } from './layouts/MainContent';
import ModalDownload from './components/ModalDownload';
import ModalSettings from './components/ModalSettings';
import LoadingOverlay from './components/LoadingOverlay';
import { initDatabase,getDataTable,defaultModelConfig } from './lib/idbHelper';
import { textToSpeech } from './lib/textToSpeech';
import '../assets/output.css';
import { path } from 'framer-motion/client';

// Main App Component
export default function App() {
    const [activeView, setActiveView] = useState('commands');
    const [messages, setMessages] = useState([]);
    const [messagesStream, setMessagesStream] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showModalSetting, setShowModalSetting] = useState(false);
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
    const [activeDownload, setActiveDownload] = useState(false);
    const [phrasesQueue, setPhrasesQueue] = useState([]);
    const phrasePointer = useRef(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [statusSpeech, setStatusSpeech] = useState(false);
    const [eos, setEos] = useState(false);
    let singleExec = null;

    useEffect(() => {
        clearTimeout(singleExec)
        singleExec = setTimeout(async () => {
            const dataInit = await initDatabase(); // Initialize the database if database is not initialized
            if(dataInit){
                setActiveDownload(true)
            }else{
                const modelPath = await getDataTable("tbSettings",[{
                    settingName: {
                        in : ["base-model"]
                    }
                }])

                if(modelPath[0].value.statusDownloaded === false){
                    setActiveDownload(true)
                }else{
                    let modelConfig = await getDataTable("tbSettings",[{
                        settingName: {
                            in : ["model-configuration"]
                        }
                    }])

                    if(modelConfig.length >= 1){
                        modelConfig = modelConfig[0].value;
                    }else{
                        modelConfig = await defaultModelConfig()
                    }

                    if(modelPath[0].value.modelPath != ""){
                        window.underWorld.initChat({
                            command : "init-chat",
                            path    : modelPath[0].value.modelPath,
                            config  : modelConfig
                        }).then((data)=>{
                            setShowLoadingOverlay(false)
                        }).catch((err) => {
                            console.error("Failed to initialize chat",err)
                            alert("something wrong tell developer to solve this")
                        });
                    }else{
                        setShowLoadingOverlay(false)
                    }
                }
            }
        }, 500);
    }, [])

    // Diperbarui: Menggunakan data dummy, bukan API call
    const handleSendMessage = async (prompt) => {
        if (!prompt) return;
        let messagesId = Date.now()
        const userMessage = { id: messagesId, role: "user", type: "user", parts: [{ text: prompt }] };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        let modelConfig = await getDataTable("tbSettings",[{
            settingName: {
                in : ["model-configuration"]
            }
        }])

        window.underWorld.sendChat({
            text    : prompt,
            config  : modelConfig[0].value,
            id      : messagesId,
        });
    };

    useEffect(() => {
        const cleanListener = window.underWorld.onResponseChat((data) => {
            setDisplayedText(displayedText+data.response);
            const answerKey = '"voice": "';
            let textToDisplay = '';
            const answerKeyIndex = displayedText.indexOf(answerKey);

            if(!eos){ //detect end of sentence token
                if (answerKeyIndex !== -1) {
                    const textStartIndex = answerKeyIndex + answerKey.length;
                    textToDisplay = displayedText.substring(textStartIndex);
                    if (textToDisplay.lastIndexOf('"') !== -1) {
                        textToDisplay = textToDisplay.substring(0, textToDisplay.lastIndexOf('"'));
                    }
                }

                // 3. Ekstrak Frasa dari 'voice' yang berhasil diekstrak
                if (textToDisplay.length > phrasePointer.current) {
                    let lastProcessedIndex = phrasePointer.current;
                    const newPhrasesFound = [];
                    
                    while (displayedText.length > 0) {
                        const endOfSentence = displayedText.indexOf('",');
                        if(endOfSentence !== -1) setEos(true);
                        const unprocessedChunk = textToDisplay.substring(lastProcessedIndex);
                        const matchIndex = unprocessedChunk.search(/[.,!?]/);
                        if (matchIndex === -1) break;
                        const phraseEndIndex = lastProcessedIndex + matchIndex + 1;
                        const newPhrase = textToDisplay.substring(lastProcessedIndex, phraseEndIndex).trim();
                        if (newPhrase) newPhrasesFound.push(newPhrase.replace(/[.,]/g, ""));
                        lastProcessedIndex = phraseEndIndex;
                    }
                        

                    if (newPhrasesFound.length > 0 && statusSpeech) {
                        setPhrasesQueue(prev => [...prev, ...newPhrasesFound]);
                        phrasePointer.current = lastProcessedIndex;
                    }
                }
            }
            

            if(data.status == "render"){
                setMessagesStream({ id: data.id, response: data.response });
            }else if (data.status == "end") {
                try {
                    setDisplayedText("");
                    setEos(false)
                    phrasePointer.current = 0;

                    let jsonResponse = JSON.parse(data.response);
                    if(jsonResponse?.voice){
                        let responseTxt = jsonResponse.answer.length > 0 ? jsonResponse.answer : jsonResponse.voice;
                        const dataMessages = {
                            id: data.id,
                            role: "model",
                            type: "direct-answer",
                            parts: [{ text: responseTxt }]
                        };
                        setMessages(prev => [...prev, dataMessages]);
                    }else if(jsonResponse?.tool_name == "readFile"){
                        window.underWorld.ragEngine({
                            id          : data.id,
                            prompt      : data.prompt,
                            tool_name   : jsonResponse.tool_name,
                            path        : jsonResponse.parameters.path,
                        });
                    }else if(jsonResponse?.tool_name == "getInternetInfo"){
                        window.underWorld.ragEngine({
                            id          : data.id,
                            prompt      : data.prompt,
                            tool_name   : jsonResponse.tool_name,
                            key         : "{KEY}",
                            cx          : "{CX}",
                            query       : jsonResponse.parameters.query,
                            ref_count   : 3, //jumlah referensi link yang diambil
                        });
                    }
                    
                    setIsLoading(false);

                } catch (error) {
                    console.error("Gagal mem-parsing JSON dari respons:", error);
                }
            }
        });

        return () => {
            cleanListener(); // Clean up the listener on unmount karena variable cleanListener return fungsi removelistener dari preload
        };
    }, [displayedText,eos])

    // Effect untuk memproses antrean TTS
    useEffect(() => {
        const processQueue = async () => {
            if (isSpeaking || phrasesQueue.length === 0 || !statusSpeech) return;
            console.log("phrasesQueue",phrasesQueue);
            setIsSpeaking(true);
            const phraseToSpeak = phrasesQueue[0];
            try {
                await speakAndWait({ text: phraseToSpeak });
            } catch (error) {
                console.warn("Speech error:", error);
            } finally {
                setPhrasesQueue(currentQueue => currentQueue.slice(1));
                setIsSpeaking(false);
            }
                
        };
        processQueue();
    }, [phrasesQueue, isSpeaking, statusSpeech]);

    useEffect(()=>{
        if(!statusSpeech){
            setPhrasesQueue([])
            setDisplayedText("");
            setEos(false)
            phrasePointer.current = 0;
        }
    },[statusSpeech])

    const handleCloseModalSetting = () => {
        setShowModalSetting(1)
    }

    function speakAndWait(options) {
        return new Promise((resolve, reject) => {
            textToSpeech({
                ...options,
                onEnd: () => {
                    // Promise akan 'selesai' (resolve) ketika ucapan berakhir.
                    resolve();
                },
                onError: (event) => {
                    // Promise akan 'gagal' (reject) jika terjadi error.
                    reject(event.error);
                }
            });
        });
    }

    return (
        <div className="bg-[#14171f] min-h-screen font-sans flex">
            {showLoadingOverlay && (
                <LoadingOverlay/>
            )}
            {showModalSetting && (
                <ModalSettings setShowModalSetting={setShowModalSetting} />
            )}
            {activeDownload && (
                <ModalDownload setActiveDownload={setActiveDownload} setShowLoadingOverlay={setShowLoadingOverlay}/>
            )}
            <CustomScrollbarStyles />
            <Sidebar activeView={activeView} setActiveView={setActiveView} handleCloseModalSetting={handleCloseModalSetting} />
            <MainContent 
                activeView={activeView}
                messages={messages}
                messagesStream={messagesStream}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                setStatusSpeech={setStatusSpeech}
                statusSpeech={statusSpeech}
            />
        </div>
    );
}
