// src/App.jsx
import '../assets/xterm.css'
import '../assets/output.css'
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Bot, 
    Clapperboard, 
    Music, 
    Settings, 
    ArrowUp, 
    User,
    Mic,
    Info,
    ChevronDown,
    Cpu,
    MemoryStick,
    HardDrive,
    KeyRound,
    Server,
    LockKeyhole,
    Wrench
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
// Impor baru untuk Xterm.js dari npm
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';


// Komponen untuk Scrollbar Kustom (CSS Global)
const CustomScrollbarStyles = () => (
    <style>{`
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #1c2027;
        }
        ::-webkit-scrollbar-thumb {
            background: #4a5568;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #718096;
        }
        .xterm .xterm-viewport {
            scrollbar-width: thin;
            scrollbar-color: #4a5568 #1c2027;
        }
    `}</style>
);


// Main App Logo SVG Component
const AppLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 013.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 01-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.197-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.197a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.197.398a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

// Sidebar Navigation Item Component
const NavItem = ({ icon: Icon, text, isActive, onClick, hasDropdown, isDropdownOpen }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-[#272d36] text-white font-semibold'
        : 'text-slate-300 hover:bg-[#1c2027] hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      <span>{text}</span>
    </div>
    {hasDropdown && (
        <ChevronDown 
            className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
        />
    )}
  </button>
);

// Sidebar Component
function Sidebar({ activeView, setActiveView }) {
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    
    const menuItems = [
        { id: 'commands', text: 'Commands Center', icon: LayoutDashboard },
        { id: 'functions', text: 'Functions', icon: Bot },
        { id: 'memories', text: 'Manage Memories', icon: Clapperboard },
        { id: 'performance', text: 'Performance Status', icon: Music },
        { id: 'api', text: 'API Access', icon: KeyRound },
        { id: 'remote', text: 'Remote', icon: Server },
        { id: 'auth', text: 'Manage key Auth', icon: LockKeyhole },
        { id: 'settings', text: 'Settings', icon: Settings },
        { id: 'tools', text: 'Tools', icon: Wrench },
    ];

    const aboutMenuItems = [
        { id: 'about-us', text: 'Tentang Kami' },
        { id: 'documentation', text: 'Dokumentasi' },
        { id: 'community', text: 'Komunitas' },
        { id: 'contact', text: 'Kontak' },
    ];

    return (
        <aside className="w-64 bg-[#0e121a] text-white flex flex-col p-3 fixed h-full border-r border-gray-700/50">
            <div className="flex items-center gap-3 mb-8 px-2 pt-2">
                <AppLogo className="w-9 h-9 text-sky-400"/>
                <h1 className="text-xl font-bold">Sapientia</h1>
            </div>
            <nav className="flex-grow space-y-1 overflow-y-auto">
                {menuItems.map(item => (
                    <NavItem 
                        key={item.id}
                        icon={item.icon} 
                        text={item.text} 
                        isActive={activeView === item.id}
                        onClick={() => setActiveView(item.id)}
                    />
                ))}
                 <div className="pt-2">
                    <NavItem 
                        icon={Info} 
                        text="About"
                        onClick={() => setIsAboutOpen(!isAboutOpen)}
                        hasDropdown={true}
                        isDropdownOpen={isAboutOpen}
                    />
                    <AnimatePresence>
                        {isAboutOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden pl-4"
                            >
                                <div className="flex flex-col pt-2 space-y-1">
                                {aboutMenuItems.map(item => (
                                    <a href="#" key={item.id} className="text-slate-400 text-sm hover:text-white transition-colors duration-200 py-1.5 px-4 rounded-md hover:bg-[#1c2027]">
                                        {item.text}
                                    </a>
                                ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>
        </aside>
    );
}

// Chat Input Component
function ChatInput({ onSendMessage, isLoading }) {
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
            className={`mx-auto ${isFocused ? 'w-full' : 'w-1/2 max-w-2xl'}`}
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
                    className={`bg-[#272d36] border border-gray-600/80 shadow-2xl shadow-black/30 flex items-center gap-2 p-2
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
                        placeholder={isFocused ? "Tanyakan apa saja pada Sapientia..." : "Tanya sesuatu..."}
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

// Placeholder views for different menu items
const PlaceholderView = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <h2 className="text-4xl font-bold text-slate-100">{title}</h2>
        <p className="text-slate-400 mt-2">Konten untuk halaman ini sedang dalam pengembangan.</p>
    </div>
);

// Suggestion Card Component
const SuggestionCard = ({ text, onClick }) => (
    <button onClick={() => onClick(text)} className="bg-[#0e121a]/80 p-4 rounded-xl border border-[#565869] hover:bg-[#272d36] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-left w-full">
        <p className="text-slate-200 text-sm">{text}</p>
    </button>
);

// Component to render a single chat message
const ChatMessage = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 my-4 ${isModel ? '' : 'justify-end'}`}
        >
            <div className={`flex-shrink-0 p-2 rounded-full ${isModel ? 'bg-sky-500 order-1' : 'bg-indigo-500 order-2'}`}>
                {isModel ? <Bot className="w-6 h-6 text-white"/> : <User className="w-6 h-6 text-white"/>}
            </div>
            <div className={`p-4 rounded-xl max-w-full ${isModel ? 'bg-[#272d36] text-slate-200 order-2' : 'bg-indigo-600 text-white order-1'}`}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.parts[0].text}</p>
            </div>
        </motion.div>
    );
};

// Xterm.js Terminal Component (Diperbarui dengan perbaikan)
const XtermComponent = ({ lastMessage }) => {
    const terminalRef = useRef(null);
    const xtermInstance = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (terminalRef.current && !xtermInstance.current) {
            // Only create Terminal and FitAddon once
            const term = new Terminal({
                cursorBlink: true,
                fontFamily: 'monospace',
                fontSize: 14,
                theme: {
                    background: '#0e121a',
                    foreground: '#d1d5db',
                    cursor: '#60a5fa',
                    selectionBackground: '#4a5568',
                },
                rows: 30,
            });
            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);

            setTimeout(() => {
                fitAddon.fit();
            }, 10);

            xtermInstance.current = term;
            fitAddonRef.current = fitAddon;

            term.writeln('\x1b[1;36mSapientia Process Terminal\x1b[0m');
            term.writeln('Menunggu proses dari model...');

            const handleResize = () => fitAddon.fit();
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                term.dispose();
                xtermInstance.current = null;
                fitAddonRef.current = null;
            };
        }
    }, []);

    useEffect(() => {
        if (lastMessage && xtermInstance.current) {
            xtermInstance.current.writeln('');
            xtermInstance.current.writeln(`\x1b[1;32m[SUCCESS]\x1b[0m Respon diterima dari model.`);
            xtermInstance.current.writeln(`\x1b[1;34m> OUTPUT:\x1b[0m`);
            xtermInstance.current.write(lastMessage.parts[0].text.replace(/\n/g, '\r\n'));
            // Optionally fit terminal after writing
            if (fitAddonRef.current) {
                setTimeout(() => fitAddonRef.current.fit(), 10);
            }
        }
    }, [lastMessage]);

    return <div ref={terminalRef} className="h-full w-full p-2" />;
};


// Main view for the chat interface
function CommandsCenter({ messages, onSendMessage, isLoading }) {
    const chatContainerRef = useRef(null);
    const lastModelMessage = messages.filter(m => m.role === 'model').pop();
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
    console.log("Last model message:", lastModelMessage);
    console.log("isChatStarted:", isChatStarted);
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
                                <h2 className="text-4xl font-bold text-slate-100 mb-12">Sapientia Commands Center</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                                    <SuggestionCard text="Analisis persentase tembakan pemain kunci..." onClick={handleSuggestionClick} />
                                    <SuggestionCard text="Evaluasi dampak cedera baru-baru ini..." onClick={handleSuggestionClick} />
                                    <SuggestionCard text="Bandingkan tren performa terkini..." onClick={handleSuggestionClick} />
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-full mx-auto w-full">
                                {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                                {isLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 my-4">
                                        <div className="p-2 rounded-full bg-sky-500">
                                            <Bot className="w-6 h-6 text-white animate-pulse"/>
                                        </div>
                                        <div className="p-4 rounded-xl bg-[#272d36] text-slate-400">
                                            Sapientia sedang berpikir...
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
                            <XtermComponent lastMessage={lastModelMessage} />
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            <div className="flex-shrink-0 p-6 pt-2">
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
            </div>
        </div>
    );
}

// Performance Status View Component
const UsageChart = ({ data, title, Icon, color, unit }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0e121a]/80 p-3 rounded-lg border border-gray-700 shadow-lg">
                    <p className="text-sm text-slate-300">{`Time: ${label}`}</p>
                    <p className="text-lg font-bold" style={{ color: color }}>{`${payload[0].value}${unit}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#0e121a] p-4 rounded-xl border border-gray-700/50 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <Icon className="w-6 h-6" style={{ color: color }} />
                <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            </div>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id={`color${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#272d36" />
                        <XAxis dataKey="time" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} unit={unit} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="usage" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${title})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, unit }) => (
    <div className="bg-[#0e121a] p-6 rounded-xl border border-gray-700/50">
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-4xl font-bold text-sky-400">
            {value} <span className="text-2xl text-slate-300">{unit}</span>
        </p>
    </div>
);

const SystemInfoCard = ({ title, data }) => (
    <div className="bg-[#0e121a] p-6 rounded-xl border border-gray-700/50 col-span-1 md:col-span-2">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
        <ul className="space-y-3">
            {data.map(item => (
                <li key={item.label} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-mono text-slate-200">{item.value}</span>
                </li>
            ))}
        </ul>
    </div>
);

function PerformanceStatus() {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const initialData = Array.from({ length: 10 }, (_, i) => ({
            time: i,
            cpu: Math.floor(Math.random() * 40) + 10,
            memory: Math.floor(Math.random() * 50) + 20,
            gpu: Math.floor(Math.random() * 30) + 5,
        }));
        setChartData(initialData.map(d => ({ ...d, time: `${d.time}s` })));

        const interval = setInterval(() => {
            setChartData(prevData => {
                const lastTime = parseInt(prevData[prevData.length - 1].time.replace('s', ''));
                const newData = {
                    time: `${lastTime + 1}s`,
                    cpu: Math.floor(Math.random() * 40) + 10,
                    memory: Math.floor(Math.random() * 50) + 20,
                    gpu: Math.floor(Math.random() * 30) + 5,
                };
                const updatedData = [...prevData, newData];
                return updatedData.length > 10 ? updatedData.slice(1) : updatedData;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const systemInfo = [
        { label: "CPU", value: "Intel Core i9-13900K" },
        { label: "Maximum Memory", value: "64 GB DDR5" },
        { label: "GPU", value: "NVIDIA GeForce RTX 4090" },
        { label: "Model", value: "Sapientia-v1.2" },
        { label: "Status", value: "Online" },
    ];

    return (
        <div className="p-6 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-slate-100 mb-6">Performance Status</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 h-80">
                    <UsageChart data={chartData.map(d => ({ time: d.time, usage: d.cpu }))} title="CPU Usage" Icon={Cpu} color="#38bdf8" unit="%" />
                    <UsageChart data={chartData.map(d => ({ time: d.time, usage: d.memory }))} title="Memory Usage" Icon={MemoryStick} color="#2dd4bf" unit="%" />
                    <UsageChart data={chartData.map(d => ({ time: d.time, usage: d.gpu }))} title="GPU Usage" Icon={HardDrive} color="#a78bfa" unit="%" />
                </div>
                <StatCard title="Processing Speed" value="18.63" unit="token/s" />
                <SystemInfoCard title="System Information" data={systemInfo} />
            </div>
        </div>
    );
}

// Main Content area that switches views
function MainContent({ activeView, messages, onSendMessage, isLoading }) {
    const renderView = () => {
        switch (activeView) {
            case 'commands':
                return <CommandsCenter messages={messages} onSendMessage={onSendMessage} isLoading={isLoading} />;
            case 'functions':
                return <PlaceholderView title="Functions" />;
            case 'memories':
                return <PlaceholderView title="Manage Memories" />;
            case 'performance':
                return <PerformanceStatus />;
            case 'api':
            case 'remote':
            case 'auth':
            case 'tools':
            case 'settings':
                return <PlaceholderView title="Settings" />;
            default:
                return <CommandsCenter messages={messages} onSendMessage={onSendMessage} isLoading={isLoading} />;
        }
    };

    return (
        <main className="ml-64 flex-1 bg-[#14171f] text-white flex flex-col h-screen overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="h-full w-full"
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </main>
    );
}

// Main App Component
export default function App() {
    const [activeView, setActiveView] = useState('commands');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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




