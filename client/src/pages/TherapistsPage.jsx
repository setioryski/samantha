import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import TherapistModal from '../components/TherapistModal';
import ConfirmationModal from '../components/ConfirmationModal';

const TherapistsPage = () => {
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedTherapist, setSelectedTherapist] = useState(null);

    // State for the report
    const [reportData, setReportData] = useState([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchTherapists = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/therapists');
            setTherapists(data);
        } catch (error) {
            showToast('Failed to load therapists.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTherapists();
    }, [fetchTherapists]);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            showToast('Please select both a start and end date.', 'error');
            return;
        }
        setLoadingReport(true);
        try {
            const { data } = await api.get(`/therapists/report?startDate=${startDate}&endDate=${endDate}`);
            setReportData(data);
        } catch (error) {
            showToast('Failed to generate therapist report.', 'error');
        } finally {
            setLoadingReport(false);
        }
    };


    const handleOpenModal = (therapist = null) => {
        setSelectedTherapist(therapist);
        setIsModalOpen(true);
    };

    const handleOpenConfirm = (therapist) => {
        setSelectedTherapist(therapist);
        setIsConfirmOpen(true);
    };
    
    const handleCloseModals = () => {
        setIsModalOpen(false);
        setIsConfirmOpen(false);
        setSelectedTherapist(null);
    };

    const handleSaveTherapist = async (therapistData) => {
        try {
            if (selectedTherapist) {
                await api.put(`/therapists/${selectedTherapist._id}`, therapistData);
                showToast('Therapist updated successfully!', 'success');
            } else {
                await api.post('/therapists', therapistData);
                showToast('Therapist added successfully!', 'success');
            }
            fetchTherapists();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save therapist.', 'error');
        } finally {
            handleCloseModals();
        }
    };
    
    const handleDeleteTherapist = async () => {
        if (!selectedTherapist) return;
        try {
            await api.delete(`/therapists/${selectedTherapist._id}`);
            showToast('Therapist deleted successfully!', 'success');
            fetchTherapists();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete therapist.', 'error');
        } finally {
            handleCloseModals();
        }
    };

    const handleToggleActive = async (therapist) => {
        try {
            await api.put(`/therapists/${therapist._id}`, { ...therapist, isActive: !therapist.isActive });
            showToast(`Therapist ${!therapist.isActive ? 'activated' : 'deactivated'}.`, 'success');
            fetchTherapists();
        } catch (error) {
            showToast('Failed to toggle therapist status.', 'error');
        }
    };

    if (loading) return <div>Loading therapists...</div>;

    return (
        <div className="space-y-8">
            {/* Therapist Management Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Therapist Management</h1>
                    <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Add Therapist
                    </button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {therapists.map(therapist => (
                                <tr key={therapist._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{therapist.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button onClick={() => handleToggleActive(therapist)} className={`px-2 py-1 text-xs rounded-full ${therapist.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {therapist.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenModal(therapist)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleOpenConfirm(therapist)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top 10 Therapists Report Section */}
            <div>
                 <h1 className="text-2xl font-bold text-gray-800 mb-4">Top 10 Therapists Report</h1>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                     <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="p-2 border rounded-md text-sm w-full"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="p-2 border rounded-md text-sm w-full"
                            />
                        </div>
                        <button
                          onClick={handleGenerateReport}
                          disabled={loadingReport}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto disabled:bg-gray-400"
                        >
                          {loadingReport ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Therapist Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Transactions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loadingReport ? (
                                    <tr><td colSpan="3" className="text-center py-4">Loading report...</td></tr>
                                ) : reportData.length > 0 ? (
                                    reportData.map((therapist, index) => (
                                        <tr key={therapist.therapistId}>
                                            <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{therapist.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{therapist.transactionCount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="text-center py-4 text-gray-500">No data for the selected period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
            
            {isModalOpen && <TherapistModal therapist={selectedTherapist} onClose={handleCloseModals} onSave={handleSaveTherapist} />}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={handleCloseModals} onConfirm={handleDeleteTherapist} title="Delete Therapist" message={`Are you sure you want to delete ${selectedTherapist?.name}?`} />}
        </div>
    );
};

export default TherapistsPage;