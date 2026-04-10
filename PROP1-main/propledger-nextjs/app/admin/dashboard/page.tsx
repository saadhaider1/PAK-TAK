'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminPropertiesSection from '@/components/admin/AdminPropertiesSection';
import AgentApprovalModal from '@/components/admin/AgentApprovalModal';
import AdminInvestmentsSection from '@/components/admin/AdminInvestmentsSection';
import AdminCrowdfundingSection from '@/components/admin/AdminCrowdfundingSection';

interface Stats {
    total_users: number;
    total_agents: number;
    total_properties: number;
    total_transactions: number;
    total_revenue: number;
    revenue_breakdown: {
        purchases: number;
        spent: number;
    };
}

interface User {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    country: string;
    user_type: string;
    created_at: string;
    is_active: boolean;
}

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
    rating: number | null;
    created_at: string;
    users?: {
        full_name: string;
        email: string;
    };
}

interface RecentUser {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
    created_at: string;
}

interface RecentTransaction {
    id: number;
    user_id: string;
    transaction_type: string;
    token_amount: number;
    pkr_amount: number;
    status: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        total_users: 0,
        total_agents: 0,
        total_properties: 0,
        total_transactions: 0,
        total_revenue: 0,
        revenue_breakdown: { purchases: 0, spent: 0 }
    });
    const [users, setUsers] = useState<User[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'agents' | 'properties' | 'transactions' | 'investments' | 'crowdfunding'>('overview');
    const [investmentNotifCount, setInvestmentNotifCount] = useState(0);
    const [crowdfundingNotifCount, setCrowdfundingNotifCount] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const [pendingAgents, setPendingAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['overview', 'users', 'agents', 'properties', 'transactions', 'investments', 'crowdfunding'].includes(tab)) {
            setActiveTab(tab as typeof activeTab);
        }
    }, [searchParams]);

    // Poll notifications every 10s (investments + crowdfunding)
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await fetch('/api/admin/notifications');
                const data = await res.json();
                if (data.success) {
                    const investCount = (data.notifications || []).filter((n: any) => n.type === 'investment_request' && !n.is_read).length;
                    const cfCount = (data.notifications || []).filter((n: any) => n.type === 'crowdfunding_request' && !n.is_read).length;
                    setInvestmentNotifCount(investCount);
                    setCrowdfundingNotifCount(cfCount);
                }
            } catch { /* silent */ }
        };
        fetchNotifs();
        const iv = setInterval(fetchNotifs, 10000);
        return () => clearInterval(iv);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
                setRecentUsers(data.recent?.users || []);
                setRecentTransactions(data.recent?.transactions || []);
            }
        } catch (error) {
            console.error('Stats fetch error:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Users fetch error:', error);
        }
    };

    const fetchAgents = async () => {
        try {
            const response = await fetch('/api/admin/agents');
            const data = await response.json();
            if (data.success) {
                setAgents(data.agents);
                // Filter pending agents
                const pending = data.agents.filter((agent: Agent) => agent.status === 'pending');
                setPendingAgents(pending);
            }
        } catch (error) {
            console.error('Agents fetch error:', error);
        }
    };

    useEffect(() => {
        // Check for admin session
        const adminToken = localStorage.getItem('admin_token');
        const storedUser = localStorage.getItem('user');

        if (!adminToken && !storedUser) {
            router.push('/admin/login');
            return;
        }

        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.user_type !== 'admin') {
                    router.push('/dashboard');
                    return;
                }
            } catch (e) {
                router.push('/admin/login');
                return;
            }
        }

        // Fetch all data
        Promise.all([fetchStats(), fetchUsers(), fetchAgents()]).then(() => {
            setLoading(false);
        });

    }, [router]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleApproveAgentsClick = () => {
        if (pendingAgents.length > 0) {
            setSelectedAgent(pendingAgents[0]);
            setShowApprovalModal(true);
        }
    };

    const handleApprovalSuccess = () => {
        // Refresh agents data
        fetchAgents();
        fetchStats();

        // Show next pending agent or close modal
        const nextPendingAgent = pendingAgents.find(agent => agent.id !== selectedAgent?.id && agent.status === 'pending');
        if (nextPendingAgent) {
            setSelectedAgent(nextPendingAgent);
        } else {
            setShowApprovalModal(false);
            setSelectedAgent(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="ml-64">
                {/* Header */}
                <AdminHeader
                    title="Admin Dashboard"
                    subtitle={`Welcome back! Here's what's happening with PropLedger today.`}
                />

                {/* Main Content Area */}
                <main className="p-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Users */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                                    +12%
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total_users}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                        </div>

                        {/* Total Agents */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                                    +5%
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total_agents}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Agents</p>
                        </div>

                        {/* Total Properties */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                                    +8%
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total_properties}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Properties</p>
                        </div>

                        {/* Total Revenue */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                                    +15%
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(stats.total_revenue)}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                        </div>
                    </div>

                    {/* ─── Tab Navigation Bar ─── */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {[
                            { key: 'overview', label: 'Overview', icon: '📊' },
                            { key: 'users', label: 'Users', icon: '👥' },
                            { key: 'agents', label: 'Agents', icon: '🏢' },
                            { key: 'properties', label: 'Properties', icon: '🏠' },
                            { key: 'investments', label: 'Investments', icon: '💰', badge: investmentNotifCount },
                            { key: 'crowdfunding', label: 'Crowdfunding', icon: '🧩', badge: crowdfundingNotifCount },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${activeTab === tab.key
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Properties Section */}
                    {activeTab === 'properties' && (
                        <AdminPropertiesSection />
                    )}

                    {/* Investments Section */}
                    {activeTab === 'investments' && (
                        <AdminInvestmentsSection />
                    )}

                    {/* Crowdfunding Section */}
                    {activeTab === 'crowdfunding' && (
                        <AdminCrowdfundingSection />
                    )}

                    {/* Overview / Users / Agents / Transactions */}
                    {(activeTab === 'overview' || activeTab === 'users' || activeTab === 'agents' || activeTab === 'transactions') && (
                        <>
                            {/* Main Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column - Users & Agents Tables */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Recent Users Section */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h2>
                                            <button
                                                onClick={() => setActiveTab('users')}
                                                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                                            >
                                                View All →
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-gray-900">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {users.slice(0, 5).map((user) => (
                                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${user.user_type === 'investor' ? 'bg-blue-100 text-blue-800' :
                                                                    user.user_type === 'agent' ? 'bg-purple-100 text-purple-800' :
                                                                        user.user_type === 'property_owner' ? 'bg-emerald-100 text-emerald-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {user.user_type?.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                {formatDate(user.created_at)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {users.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                                No users found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Agents Section */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registered Agents</h2>
                                            <button
                                                onClick={() => setActiveTab('agents')}
                                                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                                            >
                                                View All →
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-gray-900">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialization</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {agents.slice(0, 5).map((agent) => (
                                                        <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                                        {agent.users?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.users?.full_name || 'Unknown'}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{agent.license_number}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{agent.specialization}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{agent.city}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${agent.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                    agent.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {agent.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{agent.rating?.toFixed(1) || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {agents.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                                No agents found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Stats & Charts */}
                                <div className="space-y-8">
                                    {/* Income Statistics */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Income Statistics</h2>

                                        {/* Donut Chart Placeholder */}
                                        <div className="relative w-48 h-48 mx-auto mb-6">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                {/* Background circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke="#f3f4f6"
                                                    strokeWidth="12"
                                                />
                                                {/* Purchases segment */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke="#10b981"
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(stats.revenue_breakdown.purchases / (stats.total_revenue || 1)) * 251.2} 251.2`}
                                                    strokeLinecap="round"
                                                />
                                                {/* Spent segment */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke="#3b82f6"
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(stats.revenue_breakdown.spent / (stats.total_revenue || 1)) * 251.2} 251.2`}
                                                    strokeDashoffset={`-${(stats.revenue_breakdown.purchases / (stats.total_revenue || 1)) * 251.2}`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total_revenue)}</p>
                                            </div>
                                        </div>

                                        {/* Legend */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Token Purchases</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(stats.revenue_breakdown.purchases)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Token Spent</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(stats.revenue_breakdown.spent)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                                        <div className="space-y-3">
                                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <span className="font-medium">Add New Property</span>
                                            </button>
                                            <button
                                                onClick={handleApproveAgentsClick}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors relative"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                    </svg>
                                                    <span className="font-medium">Approve Agents</span>
                                                </div>
                                                {pendingAgents.length > 0 && (
                                                    <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                                        {pendingAgents.length}
                                                    </span>
                                                )}
                                            </button>
                                            {/* Investments Quick Link */}
                                            <button
                                                onClick={() => setActiveTab('investments')}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-medium">Review Investments</span>
                                                </div>
                                                {investmentNotifCount > 0 && (
                                                    <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                                        {investmentNotifCount}
                                                    </span>
                                                )}
                                            </button>
                                            {/* Crowdfunding Quick Link */}
                                            <button
                                                onClick={() => setActiveTab('crowdfunding')}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="font-medium">Review Crowdfunding</span>
                                                </div>
                                                {crowdfundingNotifCount > 0 && (
                                                    <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                                        {crowdfundingNotifCount}
                                                    </span>
                                                )}
                                            </button>
                                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="font-medium">View Reports</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                                        <div className="space-y-4">
                                            {recentTransactions.slice(0, 4).map((tx) => (
                                                <div key={tx.id} className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.transaction_type === 'purchase' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                                        tx.transaction_type === 'spend' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {tx.transaction_type === 'purchase' ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                            Token {tx.transaction_type}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {tx.token_amount} tokens • {formatCurrency(tx.pkr_amount)}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.created_at)}</span>
                                                </div>
                                            ))}
                                            {recentTransactions.length === 0 && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Agent Approval Modal */}
            {selectedAgent && (
                <AgentApprovalModal
                    agent={selectedAgent}
                    isOpen={showApprovalModal}
                    onClose={() => {
                        setShowApprovalModal(false);
                        setSelectedAgent(null);
                    }}
                    onSuccess={handleApprovalSuccess}
                />
            )}
        </div>
    );
}
