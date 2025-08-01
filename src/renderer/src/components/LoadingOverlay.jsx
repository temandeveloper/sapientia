import React, { useRef, useEffect } from 'react';

export default function LoadingOverlay(){
    const modalRef = useRef(null);

    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.showModal()
            modalRef.current.addEventListener("keydown", (e) => {
                e.preventDefault();
            });
        }
    }, [])

    return (
        <>
            <dialog ref={modalRef} id="modal-overlay" className="modal">
                <span className="loading loading-spinner loading-xl"></span>
            </dialog>
        </>
    );
}
