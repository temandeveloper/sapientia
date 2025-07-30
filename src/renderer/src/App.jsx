import React, { useEffect, useState } from 'react';
import { CustomScrollbarStyles } from './layouts/CustomScrollbarStyles';
import { Sidebar } from './layouts/Sidebar';
import { MainContent } from './layouts/MainContent';
import ModalDownload from './components/ModalDownload';
import '../assets/output.css';

// Main App Component
export default function App() {
    const [activeView, setActiveView] = useState('commands');
    const [messages, setMessages] = useState([]);
    const [messagesStream, setMessagesStream] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        window.underWorld.initChat({
            command    : "init-chat"
        }).then((data)=>{
            console.log("load model",data)
        }).catch((err) => {
            console.error("Failed to initialize chat",err)
        });
    }, [])

    // Diperbarui: Menggunakan data dummy, bukan API call
    const handleSendMessage = async (prompt) => {
        if (!prompt) return;
        let messagesId = Date.now()
        const userMessage = { id: messagesId, role: "user", parts: [{ text: prompt }] };
        setMessages(prev => [...prev, userMessage]);
        setMessagesStream(prev => [...prev, userMessage]);
        setIsLoading(true);

        window.underWorld.sendChat({
            text    : prompt,
            id      : messagesId,
        });
    };

    useEffect(() => {
        const cleanListener = window.underWorld.onResponseChat((data) => {
            if(data.status == "render"){
                setMessagesStream(prev => {
                    // Cek apakah sudah ada message model dengan id yang sama
                    const idx = prev.findIndex(
                        msg => msg.role === "model" && msg.id === data.id
                    );

                    if (idx !== -1) {
                        // Update text pada message model yang sudah ada (streaming)
                        const updated = [...prev];
                        const prevText = updated[idx].parts[0].text || "";
                        updated[idx] = {
                            ...updated[idx],
                            parts: [{ text: prevText + (data.response || "") }]
                        };

                        return updated;
                    } else {
                        // Jika belum ada, tambahkan message model baru
                        return [
                            ...prev,
                            {
                                id: data.id,
                                role: "model",
                                parts: [{ text: data.response || "" }]
                            }
                        ];
                    }
                });
            }else if (data.status == "end") {
                const dataMessages = {
                    id: data.id,
                    role: "model",
                    parts: [{ text: data.response }]
                };
                setMessages(prev => [...prev, dataMessages]);
                setIsLoading(false);
            }
        });

        return () => {
            cleanListener(); // Clean up the listener on unmount karena variable cleanListener return fungsi removelistener dari preload
        };
    }, [])

    return (
        <div className="bg-[#14171f] min-h-screen font-sans flex">
            <ModalDownload/>
            <CustomScrollbarStyles />
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <MainContent 
                activeView={activeView}
                messages={messages}
                messagesStream={messagesStream}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
            />
        </div>
    );
}
