'use client';

import { useState } from 'react';

interface InvestmentUploadFormProps {
    onSuccess?: () => void;
}

export default function InvestmentUploadForm({ onSuccess }: InvestmentUploadFormProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        minimumInvestment: '',
        expectedReturns: '',
        duration: '',
        tokenPrice: '',
        totalTokens: '',
        image: null as File | null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        data.append('price', formData.minimumInvestment); // Using price field for minimum investment
        data.append('token_price', formData.tokenPrice);
        data.append('total_tokens', formData.totalTokens);
        data.append('property_type', 'investment');
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
                setMessage('Investment opportunity uploaded successfully!');
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    location: '',
                    minimumInvestment: '',
                    expectedReturns: '',
                    duration: '',
                    tokenPrice: '',
                    totalTokens: '',
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
                <h3 className="text-xl font-semibold text-white">Upload Investment Opportunity</h3>
                <div className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm font-medium">
                    Investment
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Investment Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Luxury Beachfront Development"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
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
                        placeholder="e.g., Miami, Florida"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Investment Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the investment opportunity, expected returns, and risk factors..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
                ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Investment ($) *</label>
                    <input
                        type="number"
                        name="minimumInvestment"
                        value={formData.minimumInvestment}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="10000"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Expected Returns (%)</label>
                    <input
                        type="text"
                        name="expectedReturns"
                        value={formData.expectedReturns}
                        onChange={handleChange}
                        placeholder="12-15%"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Duration</label>
                    <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="e.g., 24 months"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
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
                        placeholder="1000"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
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
                        placeholder="1000"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Investment Image *</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600"
                />
                <p className="text-xs text-gray-500 mt-2">Upload a high-quality image of the investment (JPG, PNG)</p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Uploading Investment...' : 'Upload Investment Opportunity'}
            </button>
        </form>
    );
}
