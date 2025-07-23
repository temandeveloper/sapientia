// Komponen untuk Scrollbar Kustom (CSS Global)
export const CustomScrollbarStyles = () => (
    <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1c2027; }
        ::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #718096; }
        .xterm .xterm-viewport { scrollbar-width: thin; scrollbar-color: #4a5568 #1c2027; }
    `}</style>
);