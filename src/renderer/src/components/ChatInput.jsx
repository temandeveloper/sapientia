import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowUp, 
    Mic,
} from 'lucide-react';
import '../../assets/xterm.css';
import '../../assets/output.css';

// Chat Input Component
export function ChatInput({ onSendMessage, isLoading }) {
    const [isFocused, setIsFocused] = useState(false);
    const [prompt, setPrompt] = useState("");
    const textareaRef = useRef(null);
    const formRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (prompt.trim() && !isLoading) {
            onSendMessage(prompt);
            setPrompt("");
            textareaRef.current.style.height = 'auto';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (formRef.current && !formRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [formRef]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [prompt]);

    const showSendButton = isFocused && prompt.trim().length > 0;

    return (
        <motion.div 
            layout 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`mx-auto ${isFocused ? 'w-1/2' : 'w-1/4 max-w-2xl'}`}
        >
            <form 
                ref={formRef}
                onSubmit={handleSubmit} 
                onClick={() => setIsFocused(true)}
                className="relative"
            >
                <motion.div 
                    layout="position"
                    transition={{ duration: 0.25, type: "easeOut" }}
                    className={`bg-[#272d36] border border-gray-600/80 shadow-2xl shadow-black/30 flex items-center gap-2 p-1
                        ${isFocused ? 'rounded-2xl' : 'rounded-full'}`}
                >
                    <textarea 
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none resize-none pl-3 py-1.5 max-h-48" 
                        placeholder={isFocused ? "Ask me anything..." : "Sapientia is here"}
                        rows="1"
                    />
                    <AnimatePresence>
                        {showSendButton ? (
                            <motion.button 
                                key="send"
                                type="submit"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.2 }}
                                disabled={isLoading}
                                className="bg-sky-500 text-white rounded-full p-2 disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-sky-600 transition-colors duration-200 flex-shrink-0"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <ArrowUp className="w-5 h-5" />
                                )}
                            </motion.button>
                        ) : (
                             <motion.button 
                                key="mic"
                                type="button"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.2 }}
                                className="text-slate-300 rounded-full p-2 hover:bg-gray-700/50 transition-colors duration-200 flex-shrink-0"
                            >
                                <Mic className="w-5 h-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            </form>
        </motion.div>
    );
}