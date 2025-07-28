import React, { useEffect, useState } from 'react';
import { CustomScrollbarStyles } from './layouts/CustomScrollbarStyles';
import { Sidebar } from './layouts/Sidebar';
import { MainContent } from './layouts/MainContent';
import ModalDownload from './components/ModalDownload';
import {initDatabase} from './lib/idbHelper.js';
import '../assets/output.css';

// Main App Component
export default function App() {
    const [activeView, setActiveView] = useState('commands');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        initDatabase()
    }, []);

    // Diperbarui: Menggunakan data dummy, bukan API call
    const handleSendMessage = async (prompt) => {
        if (!prompt) return;

        const userMessage = { role: "user", parts: [{ text: prompt }] };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Simulasi respons AI dengan data dummy
        setTimeout(() => {
            const dummyResponse = {
                role: "model",
                parts: [{ text: `Ini adalah respons dummy untuk pertanyaan Anda: "${prompt}". Fitur API saat ini dinonaktifkan.` }]
            };
            setMessages(prev => [...prev, dummyResponse]);
            setIsLoading(false);
        }, 1500); // Tunda 1.5 detik untuk simulasi
    };

    return (
        <div className="bg-[#14171f] min-h-screen font-sans flex">
            <ModalDownload/>
            <CustomScrollbarStyles />
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <MainContent 
                activeView={activeView}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
            />
        </div>
    );
}
