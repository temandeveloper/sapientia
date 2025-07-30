import React, { useRef, useEffect } from 'react';

export default function LoadingOverlay({showLoadingOverlay}){
    const modalRef = useRef(null);

    useEffect(() => {
        console.log("showLoadingOverlay",showLoadingOverlay)
        if (modalRef.current) {
            if(showLoadingOverlay === 1){
                modalRef.current.showModal()
                modalRef.current.addEventListener("keydown", (e) => {
                    e.preventDefault();
                });
            }else{
                modalRef.current.close()
            }
        }
    }, [showLoadingOverlay])

    return (
        <>
            <dialog ref={modalRef} id="modal-overlay" className="modal">
                <span className="loading loading-spinner loading-xl"></span>
            </dialog>
        </>
    );
}
