import React, { useRef, useEffect, useState } from 'react';
import { 
    Save
} from 'lucide-react';
import { getDataTable,updateDataTable,defaultModelConfig } from '../lib/idbHelper';

export default function ModalSettings({ setShowModalSetting }) {
    const modalRef = useRef(null);
    const [progressSave,setProgressSave] = useState(false)
    const [temperature,setTemprature] = useState(0.8)
    const [topp,setTopp] = useState(0.95)
    const [topk,setTopk] = useState(40)
    const [minp,setMinp] = useState(0.05)
    const [systemPrompt,setSystemPrompt] = useState("")
    const [outputSchema,setOutputSchema] = useState("")

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setShowModalSetting(false);
            }
        };

        if (modalRef.current) {
            modalRef.current.showModal();
            window.addEventListener("keydown", handleEsc);
        }

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [setShowModalSetting]);

    useEffect(()=>{
        (async () => {
            let modelConfig = await getDataTable("tbSettings",[{
                settingName: {
                    in : ["model-configuration"]
                }
            }])

            if(modelConfig.length >= 1){
                modelConfig = modelConfig[0].value;
            }else{
                modelConfig = await defaultModelConfig()
            }

            setTemprature(modelConfig.temperature)
            setTopp(modelConfig.top_p)
            setTopk(modelConfig.top_k)
            setMinp(modelConfig.min_p)
            setSystemPrompt(modelConfig.system_prompt)
            setOutputSchema(modelConfig.output_schema)

        })();
    },[])

    const handleApply = async () => {
        setProgressSave(true)
        await updateDataTable("tbSettings",{
            value       : {
                system_prompt: systemPrompt,
                temperature: temperature,
                top_p: topp,
                top_k: topk,
                min_p: minp,
                output_schema: outputSchema
            },
            datetime    : Date.now(),
        },{settingName : "model-configuration"})

        window.underWorld.openContext({
            config  : {
                system_prompt: systemPrompt,
                output_schema: outputSchema
            },
        });

        setShowModalSetting(false);
    };

    return (
        <>
            <dialog ref={modalRef} id="modal-settings" className="modal">
                <div className="modal-box w-2/5 max-w-5xl">
                    <form method="dialog">
                        <button onClick={() => setShowModalSetting(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Settings</h3>
                    <span className='text-sm'>Customize your model for more possibilities</span>
                    <div className='mt-6'>
                        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                            <div className="sm:col-span-2">
                                <label for="system-prompt" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">System Prompt</label>
                                <textarea id="system-prompt" wrap="off" rows="8" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Your System Prompt here"></textarea>
                            </div>
                            <div className="w-full">
                                <label for="brand" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Temperature ({temperature})</label>
                                <input type="range" onChange={e => setTemprature(Number(e.target.value))} step="0.01" min="0.00" max="1.00" value={temperature} className="range text-white range-xs" />
                            </div>
                            <div className="w-full">
                                <label for="price" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Top-Probability / Nucleus Sampling ({topp})</label>
                                <input type="range" onChange={e => setTopp(Number(e.target.value))} step="0.01" min="0.00" max="1.00" value={topp} className="range text-white range-xs" />
                            </div>
                            <div>
                                <label for="item-weight" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Top-K</label>
                                <input type="number" onChange={e => setTopk(Number(e.target.value))} name="item-weight" value={topk} id="item-weight" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Input Top-K sampling"/>
                            </div> 
                            {/* <div>
                                <label for="item-weight" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Minimum Probability ({minp})</label>
                                <input type="range" onChange={e => setMinp(Number(e.target.value))} step="0.01" min="0.00" max="1.00" value={minp} className="range text-white range-xs" />
                            </div> */}
                            <div className="sm:col-span-2">
                                <label for="output-schema" className="block text-sm mb-2 font-medium text-gray-900 dark:text-white">Structured Output JSON Schema</label>
                                <textarea id="output-schema" wrap="off" rows="8" value={outputSchema} onChange={(e) => setOutputSchema(e.target.value)} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Your structured JSON schema here"></textarea>
                            </div>
                        </div>
                        <button onClick={handleApply} className="btn mt-6 bg-white text-black border-[#e5e5e5]">
                            {progressSave ? (
                                <span className="loading loading-spinner text-neutral"></span>
                            ) : (
                                <Save size={20} />
                            )}
                            Apply
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}
