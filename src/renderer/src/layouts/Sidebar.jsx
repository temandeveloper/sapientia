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
export function Sidebar({ activeView, setActiveView ,handleCloseModalSetting}) {
    
    const menuItems = [
        { id: 'commands', text: 'Commands Center', icon: Bot },
        { id: 'functions', text: 'Tools & Functions', icon: ToolCase },
        { id: 'memories', text: 'Manage Memories', icon: HardDrive },
        { id: 'performance', text: 'Performance Status', icon: Gauge },
        { id: 'remote', text: 'Remote', icon: Server },
        { id: 'api', text: 'API Access', icon: Cable },
        { id: 'party', text: 'Manage Third Party', icon: KeyRound },
        // Removed settings from here
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
            </nav>
            <div className="mt-auto space-y-1">
                <NavItem 
                    icon={Settings}
                    text="Settings"
                    isActive={activeView === 'settings'}
                    onClick={handleCloseModalSetting}
                />
            </div>
        </aside>
    );
}