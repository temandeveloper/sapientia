import '../../assets/xterm.css';
import '../../assets/output.css';

export const StatCard = ({ title, value, unit }) => (
    <div className="bg-[#0e121a] p-6 rounded-xl border border-gray-700/50">
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-4xl font-bold text-sky-400">
            {value} <span className="text-2xl text-slate-300">{unit}</span>
        </p>
    </div>
);