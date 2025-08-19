import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({ companyName: 'Apothecary POS' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                if (data) {
                    setSettings(data);
                    document.title = data.companyName; 
                }
            } catch (error) {
                console.error("Could not fetch settings, using defaults.", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const value = { settings, loading };

    return (
        <SettingsContext.Provider value={value}>
            {!loading && children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    return useContext(SettingsContext);
};