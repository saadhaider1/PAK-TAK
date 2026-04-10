'use client';

import { useState, useEffect, useRef } from 'react';

interface Document {
    name: string;
    url: string;
}

interface Property {
    id?: number;
    title: string;
    description: string;
    location: string;
    price: number;
    token_price: number;
    total_tokens: number;
    available_tokens: number;
    property_type: string;
    image_url: string;
    returns?: string;
    duration?: string;
    min_investment?: number;
    risk_level?: string;
    payment_schedule?: string;
    key_features?: string[];
    is_active: boolean;
    created_at?: string;
    documents?: Document[];
}

interface AdminPropertyFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    property?: Property | null;
    listingType: 'investment' | 'property' | 'crowdfunding';
}

const defaultProperty: Property = {
    title: '',
    description: '',
    location: '',
    price: 0,
    token_price: 100,
    total_tokens: 1000,
    available_tokens: 1000,
    property_type: 'residential',
    image_url: '',
    returns: '',
    duration: '',
    min_investment: 1000,
    risk_level: 'Low',
    payment_schedule: 'Quarterly',
    key_features: [],
    is_active: true,
    documents: []
};

const standardDocuments = [
    'Investment Prospectus',
    'REIT Structure Document',
    'Portfolio Details',
    'Risk Disclosure',
    'Terms & Conditions',
    'CDA Approval',
    'NOC Certificate',
    'Property Valuation Report',
    'Lease Agreement',
    'Legal Compliance'
];

export default function AdminPropertyForm({
    isOpen,
    onClose,
    onSave,
    property,
    listingType
}: AdminPropertyFormProps) {
    const [formData, setFormData] = useState<Property>({ ...defaultProperty });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [documents, setDocuments] = useState<Document[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const [activeDocName, setActiveDocName] = useState<string>('');

    useEffect(() => {
        if (property) {
            setFormData(property);
            setImagePreview(property.image_url || '');
            setDocuments(property.documents || []);
        } else {
            const defaultType = listingType === 'investment' ? 'commercial' :
                listingType === 'crowdfunding' ? 'land' : 'residential';
            setFormData({ ...defaultProperty, property_type: defaultType });
            setImagePreview('');
            setDocuments([]);
        }
    }, [property, listingType, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File too large. Maximum size is 5MB');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('type', 'image');

            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formDataUpload
            });

            const data = await response.json();

            if (data.success) {
                setFormData(prev => ({ ...prev, image_url: data.url }));
                setImagePreview(data.url);
            } else {
                setError(data.message || 'Failed to upload image');
            }
        } catch (err) {
            setError('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeDocName) return;

        setUploadingDoc(activeDocName);
        setError('');

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('type', 'document');

            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formDataUpload
            });

            const data = await response.json();

            if (data.success) {
                // Add or update document
                setDocuments(prev => {
                    const existing = prev.findIndex(d => d.name === activeDocName);
                    if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = { name: activeDocName, url: data.url };
                        return updated;
                    }
                    return [...prev, { name: activeDocName, url: data.url }];
                });
            } else {
                setError(data.message || 'Failed to upload document');
            }
        } catch (err) {
            setError('Failed to upload document. Please try again.');
        } finally {
            setUploadingDoc(null);
            setActiveDocName('');
        }
    };

    const handleDocUploadClick = (docName: string) => {
        setActiveDocName(docName);
        docInputRef.current?.click();
    };

    const removeDocument = (docName: string) => {
        setDocuments(prev => prev.filter(d => d.name !== docName));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Client-side guard: ensure required fields are filled
        if (!formData.title?.trim()) { setError('Title is required.'); setLoading(false); return; }
        if (!formData.location?.trim()) { setError('Location is required.'); setLoading(false); return; }
        if (!formData.property_type) { setError('Property type is required.'); setLoading(false); return; }

        try {
            // Include documents in description as JSON metadata
            let description = formData.description || '';

            // Add documents metadata to description
            if (documents.length > 0) {
                const docsJson = JSON.stringify(documents);
                description = description + '\n\n[DOCUMENTS]' + docsJson + '[/DOCUMENTS]';
            }

            const method = property?.id ? 'PUT' : 'POST';
            const body = property?.id
                ? { ...formData, id: property.id, description }
                : { ...formData, description };

            console.log('[AdminPropertyForm] Submitting:', method, body);

            const response = await fetch('/api/admin/properties', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            console.log('[AdminPropertyForm] Response:', data);

            if (data.success) {
                onSave();
                onClose();
            } else {
                setError(data.message || data.error || `Server error (${response.status}). Check console for details.`);
            }
        } catch (err: any) {
            console.error('[AdminPropertyForm] Network error:', err);
            setError('Network error — could not reach the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const propertyTypes = listingType === 'investment'
        ? [
            { value: 'commercial', label: 'Commercial' },
            { value: 'mixed', label: 'Mixed Use' }
        ]
        : listingType === 'crowdfunding'
            ? [
                { value: 'land', label: 'Land' },
                { value: 'mixed', label: 'Mixed Use' }
            ]
            : [
                { value: 'residential', label: 'Residential' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'industrial', label: 'Industrial' },
                { value: 'land', label: 'Land' },
                { value: 'mixed', label: 'Mixed Use' }
            ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden m-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">
                            {property?.id ? 'Edit' : 'Add New'} {listingType.charAt(0).toUpperCase() + listingType.slice(1)}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Image
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview('');
                                                setFormData(prev => ({ ...prev, image_url: '' }));
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer py-6"
                                    >
                                        {uploading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <p className="text-sm text-gray-500">Uploading...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                                                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF (max 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Basic Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="e.g., Bahria Town Karachi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="e.g., Karachi, Pakistan"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Property Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="property_type"
                                    value={formData.property_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                >
                                    {propertyTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                                placeholder="Describe the property..."
                            />
                        </div>

                        {/* Price & Token Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price (PKR) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Token Price
                                </label>
                                <input
                                    type="number"
                                    name="token_price"
                                    value={formData.token_price}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Tokens
                                </label>
                                <input
                                    type="number"
                                    name="total_tokens"
                                    value={formData.total_tokens}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Available
                                </label>
                                <input
                                    type="number"
                                    name="available_tokens"
                                    value={formData.available_tokens}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Property Details (Investment & Crowdfunding) */}
                        {(listingType === 'investment' || listingType === 'crowdfunding') && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Investment Metrics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Returns (%)
                                        </label>
                                        <input
                                            type="text"
                                            name="returns"
                                            value={formData.returns || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                            placeholder="e.g., 12-15%"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Duration
                                        </label>
                                        <input
                                            type="text"
                                            name="duration"
                                            value={formData.duration || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                            placeholder="e.g., 3-5 Years"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Investment (PKR)
                                        </label>
                                        <input
                                            type="number"
                                            name="min_investment"
                                            value={formData.min_investment || ''}
                                            onChange={handleChange}
                                            min="0"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                            placeholder="e.g., 50000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Risk Level
                                        </label>
                                        <select
                                            name="risk_level"
                                            value={formData.risk_level || 'Low'}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Schedule
                                        </label>
                                        <select
                                            name="payment_schedule"
                                            value={formData.payment_schedule || 'Quarterly'}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Yearly">Yearly</option>
                                            <option value="Maturity">At Maturity</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Key Features - Available for ALL types */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Key Features
                            </label>
                            <div className="space-y-2">
                                {(formData.key_features || []).map((feature, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={feature}
                                            onChange={(e) => {
                                                const newFeatures = [...(formData.key_features || [])];
                                                newFeatures[index] = e.target.value;
                                                setFormData(prev => ({ ...prev, key_features: newFeatures }));
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                            placeholder="e.g., AAA-Rated Tenants"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newFeatures = (formData.key_features || []).filter((_, i) => i !== index);
                                                setFormData(prev => ({ ...prev, key_features: newFeatures }));
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            key_features: [...(prev.key_features || []), '']
                                        }));
                                    }}
                                    className="px-4 py-2 text-sm text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Feature
                                </button>
                            </div>
                        </div>

                        {/* Documents Section */}
                        <div className="border-t border-gray-200 pt-5">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Documents (CDA, Terms & Conditions, etc.)
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Upload documents like Investment Prospectus, CDA Approval, Terms & Conditions, etc.
                            </p>

                            <input
                                ref={docInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                                onChange={handleDocumentUpload}
                                className="hidden"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {standardDocuments.map((docName) => {
                                    const uploadedDoc = documents.find(d => d.name === docName);
                                    const isUploading = uploadingDoc === docName;

                                    return (
                                        <div
                                            key={docName}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${uploadedDoc
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {uploadedDoc ? (
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                                <span className={`text-sm ${uploadedDoc ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                                                    {docName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {uploadedDoc && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDocument(docName)}
                                                        className="p-1 text-red-500 hover:text-red-700"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDocUploadClick(docName)}
                                                    disabled={isUploading}
                                                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${uploadedDoc
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                        } disabled:opacity-50`}
                                                >
                                                    {isUploading ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                            Uploading
                                                        </span>
                                                    ) : uploadedDoc ? 'Replace' : 'Upload'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {documents.length > 0 && (
                                <p className="mt-3 text-sm text-green-600">
                                    ✓ {documents.length} document(s) uploaded
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {loading ? 'Saving...' : (property?.id ? 'Update' : 'Create')} Property
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
