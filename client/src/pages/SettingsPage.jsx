import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const SettingsPage = () => {
    const [settings, setSettings] = useState({ companyName: '', address: '', expiringSoonDays: 30 });
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings');
            if (data) {
                setSettings({
                    companyName: data.companyName || '',
                    address: data.address || '',
                    expiringSoonDays: data.expiringSoonDays || 30,
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings, using defaults.", error);
            showToast('Could not load settings.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/settings', settings);
            showToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error("Failed to save settings", error);
            showToast(error.response?.data?.message || 'Failed to save settings.', 'error');
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Store Settings</h1>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                            Company Name
                        </label>
                        <input
                            type="text"
                            name="companyName"
                            id="companyName"
                            value={settings.companyName}
                            onChange={handleChange}
                            placeholder="e.g., Apothecary POS"
                            className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                        </label>
                        <textarea
                            name="address"
                            id="address"
                            rows="3"
                            value={settings.address}
                            onChange={handleChange}
                            placeholder="e.g., Medan, North Sumatra"
                            className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="expiringSoonDays" className="block text-sm font-medium text-gray-700">
                            Expiring Soon Threshold (Days)
                        </label>
                        <input
                            type="number"
                            name="expiringSoonDays"
                            id="expiringSoonDays"
                            value={settings.expiringSoonDays}
                            onChange={handleChange}
                            className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Set the warning period for expiring products on the dashboard.</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;