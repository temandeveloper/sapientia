import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '../../assets/xterm.css';
import '../../assets/output.css';

// Xterm.js Terminal Component (Diperbarui dengan perbaikan)
export const XtermComponent = ({ dataStreaming }) => {
    const terminalRef = useRef(null);
    const xtermInstance = useRef(null);
    const fitAddonRef = useRef(null);
    const lastStreamIdRef = useRef(null);

    useEffect(() => {
        if (terminalRef.current && !xtermInstance.current) {
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
            term.writeln('Ready to receive response...');

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
        if (dataStreaming && xtermInstance.current) {
            const term = xtermInstance.current;
            const fitAddon = fitAddonRef.current;
            const streamId = dataStreaming.id;
            const text = dataStreaming.response.replace(/\n/g, '\r\n');

            if (lastStreamIdRef.current !== streamId) {
                // New stream, print header and start new line
                term.writeln('');
                term.writeln(`\x1b[1;32m[SUCCESS]\x1b[0m Respon diterima dari model.`);
                term.writeln(`\x1b[1;34m> OUTPUT:\x1b[0m`);
                term.write(text);
                lastStreamIdRef.current = streamId;
            } else {
                // Same stream, append text to current line
                term.write(text);
            }

            if (fitAddon) {
                setTimeout(() => fitAddon.fit(), 10);
            }
        }
    }, [dataStreaming]);

    return <div ref={terminalRef} className="h-full w-full p-2" />;
};