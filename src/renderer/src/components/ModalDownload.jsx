import React, { useRef, useEffect, useState } from 'react';
import { initDatabase,getDataTable,updateDataTable } from '../lib/idbHelper';

export default function ModalDownload(){
    const modalRef = useRef(null);
    let singleExec = null;
    // State to manage download progress and active download
    const [activeDownload, setActiveDownload] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({
        downloaded: '0',
        total: '0',
        percentage: '0',
    });

    useEffect(() => {
        async function downloadDependencies() {
            await initDatabase(); // Initialize the database if database is not initialized

            let modelDownload = await getDataTable("tbSettings",[{
                settingName: {
                    in : ["base-model"]
                }
            }])

            console.log("modelDownload", modelDownload);

            if (modalRef.current && modelDownload[0].value.statusDownloaded === false) {
                modalRef.current.showModal()
                modalRef.current.addEventListener("keydown", (e) => {
                    e.preventDefault();
                });
            }

            if(activeDownload){
                console.log("Download model is already active",{
                    modelUri    : modelDownload[0].value.modelUri,
                    settingName : modelDownload[0].settingName,
                    metadata    : modelDownload[0].value,
                });
                window.underWorld.downloadModel({
                    modelUri    : modelDownload[0].value.modelUri,
                    settingName : modelDownload[0].settingName,
                    metadata    : modelDownload[0].value,
                });
            }

            console.log("ModalDownload mounted",activeDownload);
        }
        downloadDependencies();
    }, [activeDownload]);

    const handleActiveDownload = () => {
        setActiveDownload(true);
    }

    useEffect(() => {
        const cleanListener = window.underWorld.onDownloadProgress((data) => { // Listen ini ngebug tertrigger beberapa kali
            if(data.path != ""){
                try {
                    clearTimeout(singleExec)
                    singleExec = setTimeout(async () => {
                        data.metadata.statusDownloaded = true;
                        data.metadata.modelPath = data.path;

                        updateDataTable("tbSettings",{
                            value       : data.metadata,
                            datetime    : Date.now(),
                        },{settingName : data.settingName})
                        modalRef.current.close()
                     
                        window.underWorld.initChat({
                            command : "init-chat",
                            path    : data.path,
                        }).then((data)=>{
                            window.underWorld.notification({ title: "RabBit Info", body: `Download model is success` });
                        }).catch((err) => {
                            console.error("Failed to initialize chat",err)
                            alert("something wrong to initialize chat tell developer to solve this issue")
                        });
                        console.log("Download model is success")
                    }, 1500); // should match OS multi-click speed
                } catch (error) {
                    console.log("Download model failed", error);
                }
            }else{
                // Update the download progress state
                setDownloadProgress(data);
            }
        });

        return () => {
            cleanListener(); // Clean up the listener on unmount karena variable cleanListener return fungsi removelistener dari preload
            if (singleExec) {
                clearTimeout(singleExec);
            }
        };
    }, []);

    

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
                            <div className="mb-1 text-xs font-medium dark:text-white">Download progress: <span id="progress-data">{downloadProgress.downloaded}</span> / <span id="total-data">{downloadProgress.total}</span> (<span id="percentage-data">{downloadProgress.percentage}</span>%)</div>
                            <progress className="progress progress-info w-full" value={downloadProgress.percentage} max="100"></progress>
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
