import { ChevronDown } from 'lucide-react';
import '../../assets/xterm.css';
import '../../assets/output.css';

// Sidebar Navigation Item Component
export const NavItem = ({ icon: Icon, text, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex cursor-pointer items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-[#272d36] text-white font-semibold'
        : 'text-slate-300 hover:bg-[#1c2027] hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      <span>{text}</span>
    </div>
  </button>
);