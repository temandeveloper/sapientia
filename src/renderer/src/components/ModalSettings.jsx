import React, { useRef, useEffect, useState } from 'react';
import { 
    Save
} from 'lucide-react';
import { initDatabase,getDataTable,updateDataTable } from '../lib/idbHelper';

export default function ModalSettings({ showModalSetting, setShowModalSetting }) {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                setShowModalSetting(0);
            }
        };

        if (modalRef.current && showModalSetting === 1) {
            modalRef.current.showModal();
            window.addEventListener("keydown", handleEsc);
        }

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [showModalSetting, setShowModalSetting]);

    const handleClose = () => {
        setShowModalSetting(0);
    };

    return (
        <>
            <dialog ref={modalRef} id="modal-settings" className="modal">
                <div className="modal-box w-2/5 max-w-5xl">
                    <form method="dialog">
                        <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Settings</h3>
                    <span className='text-sm'>Customize your model for more possibilities</span>
                    <form className='mt-6' action="#">
                        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                            <div className="sm:col-span-2">
                                <label for="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">System Prompt</label>
                                <textarea id="description" rows="8" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Your System Prompt here"></textarea>
                            </div>
                            <div className="w-full">
                                <label for="brand" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Temperature (0.8)</label>
                                <input type="range" min="0" max="100" className="range text-[#47698F] range-xs" />
                            </div>
                            <div className="w-full">
                                <label for="price" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Top-Probability / Nucleus Sampling (0.95)</label>
                                <input type="range" min="0" max="100" className="range text-[#47698F] range-xs" />
                            </div>
                            <div>
                                <label for="item-weight" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Top-K</label>
                                <input type="number" name="item-weight" id="item-weight" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="12" required=""/>
                            </div> 
                            <div>
                                <label for="item-weight" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Minimum Probability (0.04)</label>
                                <input type="range" min="0" max="100" className="range text-[#47698F] range-xs" />
                            </div>
                            <div className="sm:col-span-2">
                                <label for="description" className="block text-sm mb-2 font-medium text-gray-900 dark:text-white">Structured Output JSON Schema</label>
                                <textarea id="description" rows="8" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Your structured JSON schema here"></textarea>
                            </div>
                        </div>
                        <button className="mt-6 btn bg-[#47698F] text-white border-[#35567b]">
                            <Save/>
                            Apply
                        </button>
                    </form>
                </div>
            </dialog>
        </>
    );
}
