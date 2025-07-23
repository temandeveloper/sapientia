import { motion, AnimatePresence } from 'framer-motion';
import { RemoteConnection } from '../components/RemoteConnection';
import { CommandsCenter } from '../components/CommandsCenter';
import { PlaceholderView } from '../components/PlaceholderView';
import { PerformanceStatus } from '../components/PerformanceStatus';
import '../../assets/xterm.css';
import '../../assets/output.css';

// Main Content area that switches views
export function MainContent({ activeView, messages, onSendMessage, isLoading }) {
    const renderView = () => {
        switch (activeView) {
            case 'commands':
                return <CommandsCenter messages={messages} onSendMessage={onSendMessage} isLoading={isLoading} />;
            case 'functions':
                return <PlaceholderView title="Tools & Functions" />;
            case 'memories':
                return <PlaceholderView title="Manage Memories" />;
            case 'performance':
                return <PerformanceStatus />;
            case 'remote': // <-- Case baru untuk Remote
                return <RemoteConnection />;
            case 'api':
                return <PlaceholderView title="Manage API" />;
            case 'auth':
                return <PlaceholderView title="Manage Authentication" />;
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