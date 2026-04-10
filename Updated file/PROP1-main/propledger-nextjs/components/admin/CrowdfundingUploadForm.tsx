'use client';

import { useState } from 'react';

interface CrowdfundingUploadFormProps {
    onSuccess?: () => void;
}

export default function CrowdfundingUploadForm({ onSuccess }: CrowdfundingUploadFormProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        targetAmount: '',
        currentAmount: '0',
        tokenPrice: '',
        totalTokens: '',
        endDate: '',
        image: null as File | null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, image: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('location', formData.location);
        data.append('price', formData.targetAmount); // Using price field for target amount
        data.append('token_price', formData.tokenPrice);
        data.append('total_tokens', formData.totalTokens);
        data.append('property_type', 'crowdfunding');
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            const res = await fetch('http://localhost/PROPLEDGER/admin/add_property.php', {
                method: 'POST',
                body: data,
                credentials: 'include',
            });
            const result = await res.json();
            if (result.success) {
                setMessage('Crowdfunding campaign uploaded successfully!');
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    location: '',
                    targetAmount: '',
                    currentAmount: '0',
                    tokenPrice: '',
                    totalTokens: '',
                    endDate: '',
                    image: null,
                });
                if (onSuccess) onSuccess();
            } else {
                setMessage('Error: ' + result.error);
            }
        } catch (error) {
            setMessage('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Upload Crowdfunding Campaign</h3>
                <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                    Crowdfunding
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Campaign Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Downtown Commercial Plaza"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Location *</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="e.g., New York, USA"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Campaign Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the crowdfunding campaign, goals, and timeline..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Target Amount ($) *</label>
                    <input
                        type="number"
                        name="targetAmount"
                        value={formData.targetAmount}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="500000"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Token Price ($) *</label>
                    <input
                        type="number"
                        name="tokenPrice"
                        value={formData.tokenPrice}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="100"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Total Tokens *</label>
                    <input
                        type="number"
                        name="totalTokens"
                        value={formData.totalTokens}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="5000"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Campaign Image *</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                />
                <p className="text-xs text-gray-500 mt-2">Upload a high-quality image of the campaign (JPG, PNG)</p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Uploading Campaign...' : 'Upload Crowdfunding Campaign'}
            </button>
        </form>
    );
}
