import '../../assets/xterm.css';
import '../../assets/output.css';
// Placeholder views for different menu items
export const PlaceholderView = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <h2 className="text-4xl font-bold text-slate-100">{title}</h2>
        <p className="text-slate-400 mt-2">Konten untuk halaman ini sedang dalam pengembangan.</p>
    </div>
);