'use client';

import { useState, useEffect } from 'react';
import AdminPropertyForm from './AdminPropertyForm';

interface Property {
    id: number;
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
    is_active: boolean;
    created_at: string;
}

export default function AdminPropertiesSection() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<'investment' | 'property' | 'crowdfunding'>('investment');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const fetchProperties = async () => {
        try {
            const response = await fetch(`/api/admin/properties?property_type=${activeSubTab}`);
            const data = await response.json();
            if (data.success) {
                setProperties(data.properties);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchProperties();
    }, [activeSubTab]);

    const handleSave = () => {
        fetchProperties(); // Refresh the list
    };

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`/api/admin/properties?id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                fetchProperties();
            }
        } catch (error) {
            console.error('Error deleting property:', error);
        }
        setDeleteConfirm(null);
    };

    const handleAddNew = () => {
        setEditingProperty(null);
        setIsFormOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Property Form Modal */}
            <AdminPropertyForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingProperty(null);
                }}
                onSave={handleSave}
                property={editingProperty}
                listingType={activeSubTab}
            />

            {/* Sub-tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
                <div className="flex">
                    <button
                        onClick={() => setActiveSubTab('investment')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${activeSubTab === 'investment'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        📈 Investments
                    </button>
                    <button
                        onClick={() => setActiveSubTab('property')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${activeSubTab === 'property'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        🏠 Properties
                    </button>
                    <button
                        onClick={() => setActiveSubTab('crowdfunding')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${activeSubTab === 'crowdfunding'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        🤝 Crowdfunding
                    </button>
                </div>
            </div>

            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {activeSubTab === 'investment' ? 'Investment Properties' :
                            activeSubTab === 'property' ? 'Regular Properties' :
                                'Crowdfunding Campaigns'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your {activeSubTab} listings
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add {activeSubTab === 'investment' ? 'Investment' :
                        activeSubTab === 'property' ? 'Property' :
                            'Campaign'}
                </button>
            </div>

            {/* Properties Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No {activeSubTab}s found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first {activeSubTab}.</p>
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add {activeSubTab === 'investment' ? 'Investment' :
                            activeSubTab === 'property' ? 'Property' :
                                'Campaign'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                        <div
                            key={property.id}
                            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all ${!property.is_active ? 'opacity-60' : ''
                                }`}
                        >
                            {/* Image with gradient */}
                            <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
                                {property.image_url && (
                                    <img
                                        src={property.image_url}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${property.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {property.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 text-lg truncate">{property.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">{property.property_type} • {property.location}</p>

                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Price</p>
                                        <p className="font-semibold text-emerald-600">{formatCurrency(property.price)}</p>
                                    </div>
                                    {activeSubTab === 'investment' && property.returns && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Returns</p>
                                            <p className="font-semibold text-green-600">{property.returns}</p>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-gray-400 mb-4">
                                    Created: {formatDate(property.created_at)}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(property)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    {deleteConfirm === property.id ? (
                                        <>
                                            <button
                                                onClick={() => handleDelete(property.id)}
                                                className="px-3 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(property.id)}
                                            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
