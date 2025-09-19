import React, { useState, useEffect } from 'react';

const TherapistModal = ({ therapist, onClose, onSave }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (therapist) {
            setName(therapist.name);
        }
    }, [therapist]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{therapist ? 'Edit Therapist' : 'Add New Therapist'}</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Therapist Name" className="w-full p-2 border rounded" required />
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Therapist</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TherapistModal;