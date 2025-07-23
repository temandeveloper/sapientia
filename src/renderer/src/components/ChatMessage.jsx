import { motion } from 'framer-motion';
import { 
    Bot, 
    User,
} from 'lucide-react';
import '../../assets/xterm.css';
import '../../assets/output.css';

// Component to render a single chat message
export const ChatMessage = ({ message }) => {
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