import '../../assets/xterm.css';
import '../../assets/output.css';

// Suggestion Card Component
export const SuggestionCard = ({ text, onClick }) => (
    <button onClick={() => onClick(text)} className="bg-[#0e121a]/80 p-4 rounded-xl border border-[#565869] hover:bg-[#272d36] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 text-left w-full">
        <p className="text-slate-200 text-sm">{text}</p>
    </button>
);