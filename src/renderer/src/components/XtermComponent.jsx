import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '../../assets/xterm.css';
import '../../assets/output.css';

// Xterm.js Terminal Component (Diperbarui dengan perbaikan)
export const XtermComponent = ({ lastMessage }) => {
    const terminalRef = useRef(null);
    const xtermInstance = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (terminalRef.current && !xtermInstance.current) {
            // Only create Terminal and FitAddon once
            const term = new Terminal({
                cursorBlink: true,
                fontFamily: 'monospace',
                fontSize: 14,
                theme: {
                    background: '#0e121a',
                    foreground: '#d1d5db',
                    cursor: '#60a5fa',
                    selectionBackground: '#4a5568',
                },
                rows: 30,
            });
            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);

            setTimeout(() => {
                fitAddon.fit();
            }, 10);

            xtermInstance.current = term;
            fitAddonRef.current = fitAddon;

            term.writeln('\x1b[1;36mSapientia Process Terminal\x1b[0m');
            term.writeln('Menunggu proses dari model...');

            const handleResize = () => fitAddon.fit();
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                term.dispose();
                xtermInstance.current = null;
                fitAddonRef.current = null;
            };
        }
    }, []);

    useEffect(() => {
        if (lastMessage && xtermInstance.current) {
            xtermInstance.current.writeln('');
            xtermInstance.current.writeln(`\x1b[1;32m[SUCCESS]\x1b[0m Respon diterima dari model.`);
            xtermInstance.current.writeln(`\x1b[1;34m> OUTPUT:\x1b[0m`);
            xtermInstance.current.write(lastMessage.parts[0].text.replace(/\n/g, '\r\n'));
            // Optionally fit terminal after writing
            if (fitAddonRef.current) {
                setTimeout(() => fitAddonRef.current.fit(), 10);
            }
        }
    }, [lastMessage]);

    return <div ref={terminalRef} className="h-full w-full p-2" />;
};