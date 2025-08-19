import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type, visible: true });
        
        // Automatically hide the toast after 3 seconds
        setTimeout(() => {
            setToast(prevToast => prevToast ? { ...prevToast, visible: false } : null);
            setTimeout(() => setToast(null), 300); // Allow fade-out animation
        }, 3000);
    }, []);

    const hideToast = () => {
        setToast(prevToast => prevToast ? { ...prevToast, visible: false } : null);
        setTimeout(() => setToast(null), 300);
    };

    const value = { showToast, hideToast, toast };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};