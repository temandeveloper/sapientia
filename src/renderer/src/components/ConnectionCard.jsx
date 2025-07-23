import { motion } from 'framer-motion';

import '../../assets/xterm.css';
import '../../assets/output.css';

// --- START: Komponen Remote Connection ---
export const ConnectionCard = ({ icon: Icon, title, description, onClick, disabled }) => (
    <motion.button
        whileHover={{ scale: disabled ? 1 : 1.03 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={onClick}
        disabled={disabled}
        className={`bg-[#0e121a] p-8 rounded-2xl border border-gray-700/50 text-left w-full max-w-sm flex flex-col items-center text-center
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <Icon className="w-16 h-16 mb-4 text-sky-400" />
        <h3 className="text-2xl font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
    </motion.button>
);