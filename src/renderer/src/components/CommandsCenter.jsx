import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bot, 
} from 'lucide-react';
import '../../assets/xterm.css';
import '../../assets/output.css';
import { ChatInput } from './ChatInput';
import { SuggestionCard } from './SuggestionCard';
import { XtermComponent } from './XtermComponent';
import { ChatMessage } from './ChatMessage';

// Main view for the chat interface
export function CommandsCenter({ 
    messages,
    messagesStream,
    onSendMessage,
    isLoading,
    setStatusSpeech,
    statusSpeech
}){
    const chatContainerRef = useRef(null);
    const isChatStarted = messages.length > 0;

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSuggestionClick = (text) => {
        onSendMessage(text);
    };
    
    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-grow flex overflow-hidden">
                <motion.div 
                    layout 
                    transition={{ duration: 0.5, type: 'spring', bounce: 0.1 }}
                    className={`h-full flex flex-col ${isChatStarted ? 'w-1/2' : 'w-full'}`}
                >
                    <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6">
                        {!isChatStarted ? (
                            <div className="flex flex-col items-center justify-center text-center h-full">
                                <h2 className="text-2xl font-semibold text-slate-100 mb-4">Sapientia The Art of Code Engineering</h2>
                                <p className='text-[0.938rem] text-slate-100 mb-12 w-1/2'>Sapientia makes your device smarter and more private — like your own personal assistant. Engineered with RAG capabilities to access information from the internet or your local documents, it can also interact with your device via console for enhanced accessibility and seamless integration.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                                    <SuggestionCard text="Craft a beautiful poem" onClick={handleSuggestionClick} />
                                    <SuggestionCard text="Check your system information" onClick={handleSuggestionClick} />
                                    <SuggestionCard text="Write a simple code to generate Fibonacci" onClick={handleSuggestionClick} />
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-full mx-auto w-full">
                                {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                                {isLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 my-4">
                                        <div className="p-4 animate-pulse rounded-xl bg-[#272d36] text-slate-400">
                                            Sapientia is still thinking...
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
                <AnimatePresence>
                {isChatStarted && (
                    <motion.div 
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.5, type: 'spring', bounce: 0.1 }}
                        className="w-1/2 h-full p-4 pl-0"
                    >
                        <div className="h-full w-full bg-[#0e121a] rounded-lg overflow-hidden">
                            <XtermComponent dataStreaming={messagesStream} />
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            <div className="flex-shrink-0 p-6 pt-2">
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} statusSpeech={statusSpeech} setStatusSpeech={setStatusSpeech}/>
            </div>
        </div>
    );
}