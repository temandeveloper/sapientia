import React, { useRef, useEffect, useState } from 'react';
export default function ModalDownload(){
    const modalRef = useRef(null);
    const downloadProgressData = useRef(null);
    const downloadProgressTotal = useRef(null);
    const downloadProgressPercentage = useRef(null);
    const downloadProgressBar = useRef(null);
    // State to manage download progress and active download
    const [activeDownload, setActiveDownload] = useState(false);

    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.showModal()
            modalRef.current.addEventListener("keydown", (e) => {
                e.preventDefault();
            });
        }
        console.log("ModalDownload mounted",activeDownload);
    }, []);

    const handleActiveDownload = () => {
        window.underWorld.downloadModel({
            command    : "download-model"
        });
        setActiveDownload(true);
    }

    window.underWorld.onDownloadProgress((data) => {
        downloadProgressData.current.textContent = data.downloaded;
        downloadProgressTotal.current.textContent = data.total;
        downloadProgressPercentage.current.textContent = data.percentage;
        downloadProgressBar.current.value = data.percentage;
        if(parseFloat(data.percentage) >= 100){
            try {
                // {update database in this line}
                clearTimeout(singleExec)
                singleExec = setTimeout(async () => {
                    console.log("Download model is success")
                    modalRef.current.close()
                    window.underWorld.notification({ title: "RabBit Info", body: `Download model is success` });
                }, 1500); // should match OS multi-click speed
            } catch (error) {
                alert("Failed to download model")
            }
            
        }
    });

    return (
        <>
            <dialog ref={modalRef} id="modal-download" className="modal">
                <div className="modal-box w-1/3 max-w-5xl">
                    <h3 className="font-bold text-lg">Initializing required dependencies</h3>
                    <p className="py-4">
                        Downloading the required Gemma AI model. <br/>By downloading the Gemma AI model, You agree to abide by the Gemma Terms of Use. Gemma is provided under and subject to the Gemma Terms of Use, which can be found at <b onClick={()=>{window.underWorld.gotoLink("https://ai.google.dev/gemma/terms")}} className="link-href cursor-pointer">ai.google.dev/gemma/terms</b>.
                        <br />Please maintain your internet connection until setup is complete.
                    </p>
                    {activeDownload ? (
                        <>
                            <div className="mb-1 text-xs font-medium dark:text-white">Download progress: <span ref={downloadProgressData} id="progress-data">0</span> / <span ref={downloadProgressTotal} id="total-data">0</span> (<span ref={downloadProgressPercentage} id="percentage-data">0</span>%)</div>
                            <progress ref={downloadProgressBar} className="progress progress-info w-full" value="0" max="100"></progress>
                        </>
                    ) : (
                        <>
                            <button onClick={handleActiveDownload} className="btn bg-white text-black border-[#e5e5e5]">
                                <svg className="w-6 h-6 text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01"></path>
                                </svg>
                                Start Download
                            </button>
                        </>
                    )}
                    
                </div>
            </dialog>
        </>
    );
}
