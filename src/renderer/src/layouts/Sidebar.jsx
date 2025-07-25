import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bot, 
    ToolCase, 
    HardDrive, 
    Gauge, 
    Settings, 
    Info,
    Cable,
    Server,
    KeyRound,
} from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { NavItem } from '../components/NavItem';

import '../../assets/xterm.css';
import '../../assets/output.css';

// Sidebar Component
export function Sidebar({ activeView, setActiveView }) {
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    
    const menuItems = [
        { id: 'commands', text: 'Commands Center', icon: Bot },
        { id: 'functions', text: 'Tools & Functions', icon: ToolCase },
        { id: 'memories', text: 'Manage Memories', icon: HardDrive },
        { id: 'performance', text: 'Performance Status', icon: Gauge },
        { id: 'remote', text: 'Remote', icon: Server }, // Menu baru
        { id: 'api', text: 'API Access', icon: Cable },
        { id: 'party', text: 'Manage Third Party', icon: KeyRound },
        { id: 'settings', text: 'Settings', icon: Settings },
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