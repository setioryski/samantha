import React from 'react';
import { useToast } from '../context/ToastContext';

const Toast = () => {
    const { toast, hideToast } = useToast();

    if (!toast) {
        return null;
    }

    const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform z-50";
    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };

    const visibilityClasses = toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5';

    return (
        <div 
            className={`${baseClasses} ${typeClasses[toast.type] || typeClasses.info} ${visibilityClasses}`}
            onClick={hideToast}
        >
            {toast.message}
        </div>
    );
};

export default Toast;