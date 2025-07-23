import React, { useState, useEffect } from 'react';
import { 
    Cpu,
    MemoryStick,
    HardDrive,

} from 'lucide-react';
import '../../assets/xterm.css';
import '../../assets/output.css';
import { UsageChart } from './UsageChart';
import { StatCard } from './StatCard';
import { SystemInfoCard } from './SystemInfoCard';


export function PerformanceStatus() {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const initialData = Array.from({ length: 10 }, (_, i) => ({
            time: i,
            cpu: Math.floor(Math.random() * 40) + 10,
            memory: Math.floor(Math.random() * 50) + 20,
            gpu: Math.floor(Math.random() * 30) + 5,
        }));
        setChartData(initialData.map(d => ({ ...d, time: `${d.time}s` })));

        const interval = setInterval(() => {
            setChartData(prevData => {
                const lastTime = parseInt(prevData[prevData.length - 1].time.replace('s', ''));
                const newData = {
                    time: `${lastTime + 1}s`,
                    cpu: Math.floor(Math.random() * 40) + 10,
                    memory: Math.floor(Math.random() * 50) + 20,
                    gpu: Math.floor(Math.random() * 30) + 5,
                };
                const updatedData = [...prevData, newData];
                return updatedData.length > 10 ? updatedData.slice(1) : updatedData;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const systemInfo = [
        { label: "CPU", value: "Intel Core i9-13900K" },
        { label: "Maximum Memory", value: "64 GB DDR5" },
        { label: "GPU", value: "NVIDIA GeForce RTX 4090" },
        { label: "Model", value: "Sapientia-v1.2" },
        { label: "Status", value: "Online" },
    ];

    return (
        <div className="p-6 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-slate-100 mb-6">Performance Status</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 h-80">
                    <UsageChart data={chartData.map(d => ({ time: d.time, usage: d.cpu }))} title="CPU Usage" Icon={Cpu} color="#38bdf8" unit="%" />
                    <UsageChart data={chartData.map(d => ({ time: d.time, usage: d.memory }))} title="Memory Usage" Icon={MemoryStick} color="#2dd4bf" unit="%" />
                    <UsageChart data={chartData.map(d => ({ time: d.time, usage: d.gpu }))} title="GPU Usage" Icon={HardDrive} color="#a78bfa" unit="%" />
                </div>
                <StatCard title="Processing Speed" value="18.63" unit="token/s" />
                <SystemInfoCard title="System Information" data={systemInfo} />
            </div>
        </div>
    );
}