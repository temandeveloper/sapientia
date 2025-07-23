import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import '../../assets/xterm.css';
import '../../assets/output.css';

// Performance Status View Component
export const UsageChart = ({ data, title, Icon, color, unit }) => {
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