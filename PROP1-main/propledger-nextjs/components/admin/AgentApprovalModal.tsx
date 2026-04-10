'use client';

import { useState } from 'react';

interface Agent {
    id: number;
    user_id: string;
    license_number: string;
    experience: string;
    specialization: string;
    city: string;
    agency: string | null;
    phone: string;
    status: string;
    created_at: string;
    users?: {
        full_name: string;
        email: string;
    };
}

interface AgentApprovalModalProps {
    agent: Agent;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AgentApprovalModal({ agent, isOpen, onClose, onSuccess }: AgentApprovalModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAction = async (action: 'approve' | 'reject') => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/agents/${agent.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Failed to update agent status');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Review Agent Application</h3>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Agent Info */}
                        <div className="space-y-4">
                            {/* Name & Email */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                    {agent.users?.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {agent.users?.full_name || 'Unknown'}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{agent.users?.email}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">License Number</label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{agent.license_number}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{agent.phone}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Experience</label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{agent.experience}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Specialization</label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{agent.specialization}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">City</label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{agent.city}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Agency</label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{agent.agency || 'Independent'}</p>
                                </div>
                            </div>

                            {/* Application Date */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <span className="font-medium">Application Date:</span> {new Date(agent.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2.5 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleAction('reject')}
                            disabled={loading}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            Reject
                        </button>
                        <button
                            onClick={() => handleAction('approve')}
                            disabled={loading}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
