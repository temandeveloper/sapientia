import '../../assets/xterm.css';
import '../../assets/output.css';

export const SystemInfoCard = ({ title, data }) => (
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