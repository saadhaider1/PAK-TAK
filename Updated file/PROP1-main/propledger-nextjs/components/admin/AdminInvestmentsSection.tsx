'use client';

import { useState, useEffect, useCallback } from 'react';

interface InvestmentRequest {
    id: number;
    user_id: string;
    property_id: number;
    property_title: string;
    user_name: string;
    user_email: string;
    amount: number;
    admin_set_amount: number | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    reviewed_at: string | null;
    created_at: string;
    users?: { id: string; full_name: string; email: string; phone: string };
    properties?: { id: number; title: string; location: string; price: number; property_type: string };
}

interface Restriction {
    id: number;
    user_id: string;
    reason: string;
    is_active: boolean;
    restricted_at: string;
}

export default function AdminInvestmentsSection() {
    const [investments, setInvestments] = useState<InvestmentRequest[]>([]);
    const [restrictions, setRestrictions] = useState<Restriction[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Modal state
    const [modal, setModal] = useState<{
        type: 'approve' | 'reject' | 'restrict' | 'setTotal' | 'note' | null;
        investment: InvestmentRequest | null;
    }>({ type: null, investment: null });
    const [modalNote, setModalNote] = useState('');
    const [modalAmount, setModalAmount] = useState('');
    const [restrictReason, setRestrictReason] = useState('');

    // Toast
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/investments');
            const data = await res.json();
            if (data.success) {
                setInvestments(data.investments);
                setRestrictions(data.restrictions.filter((r: Restriction) => r.is_active));
            }
        } catch {
            showToast('Failed to load investment data', false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const isRestricted = (userId: string) => restrictions.some(r => r.user_id === userId && r.is_active);

    const post = async (payload: object): Promise<boolean> => {
        setActionLoading((payload as any).investment_id ?? -1);
        try {
            const res = await fetch('/api/admin/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) { showToast(data.message); return true; }
            showToast(data.error || 'Action failed', false);
            return false;
        } catch {
            showToast('Network error', false);
            return false;
        } finally {
            setActionLoading(null);
        }
    };

    const closeModal = () => {
        setModal({ type: null, investment: null });
        setModalNote('');
        setModalAmount('');
        setRestrictReason('');
    };

    const handleApprove = async () => {
        if (!modal.investment) return;
        const ok = await post({ action: 'approve', investment_id: modal.investment.id, admin_note: modalNote });
        if (ok) { closeModal(); fetchData(); }
    };

    const handleReject = async () => {
        if (!modal.investment) return;
        const ok = await post({ action: 'reject', investment_id: modal.investment.id, admin_note: modalNote });
        if (ok) { closeModal(); fetchData(); }
    };

    const handleRestrict = async () => {
        if (!modal.investment) return;
        const ok = await post({ action: 'restrict', user_id: modal.investment.user_id, reason: restrictReason });
        if (ok) { closeModal(); fetchData(); }
    };

    const handleUnrestrict = async (userId: string) => {
        const ok = await post({ action: 'unrestrict', user_id: userId });
        if (ok) fetchData();
    };

    const handleSetTotal = async () => {
        if (!modal.investment || !modalAmount) return;
        const ok = await post({ action: 'set_total', investment_id: modal.investment.id, total_amount: parseFloat(modalAmount) });
        if (ok) { closeModal(); fetchData(); }
    };

    const filtered = investments.filter(i => statusFilter === 'all' ? true : i.status === statusFilter);
    const pendingCount = investments.filter(i => i.status === 'pending').length;

    const statusBadge = (status: string) => {
        const cfg: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-800 border border-amber-200',
            approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            rejected: 'bg-red-100 text-red-800 border border-red-200',
        };
        return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg[status] || 'bg-gray-100 text-gray-700'}`;
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // ─── Render ────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium animate-in slide-in-from-top-2 transition-all ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    <span>{toast.ok ? '✓' : '✕'}</span>
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Investment Requests
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                                {pendingCount} pending
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Review, approve or reject user investment requests and manage investing privileges.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requests', value: investments.length, color: 'text-gray-900 dark:text-white', bg: 'bg-white dark:bg-gray-800' },
                    { label: 'Pending', value: investments.filter(i => i.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Approved', value: investments.filter(i => i.status === 'approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Restricted Users', value: restrictions.length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm`}>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${statusFilter === f
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                            }`}
                    >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== 'all' && (
                            <span className="ml-2 opacity-70">{investments.filter(i => i.status === f).length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No {statusFilter === 'all' ? '' : statusFilter} investment requests</h3>
                        <p className="text-gray-400 text-sm mt-1">Investment requests from users will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                    {['Investor', 'Property', 'Amount Requested', 'Admin Amount', 'Status', 'Date', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {filtered.map(inv => {
                                    const restricted = isRestricted(inv.user_id);
                                    return (
                                        <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                            {/* Investor */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {(inv.users?.full_name || inv.user_name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {inv.users?.full_name || inv.user_name || 'Unknown'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {inv.users?.email || inv.user_email || '—'}
                                                        </p>
                                                        {restricted && (
                                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                                                🚫 Restricted
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Property */}
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {inv.properties?.title || inv.property_title || `#${inv.property_id}`}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {inv.properties?.location || inv.properties?.property_type || '—'}
                                                </p>
                                            </td>

                                            {/* Amount Requested */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {fmt(inv.amount)}
                                                </span>
                                            </td>

                                            {/* Admin Set Amount */}
                                            <td className="px-5 py-4">
                                                {inv.admin_set_amount ? (
                                                    <span className="text-sm font-bold text-emerald-600">
                                                        {fmt(inv.admin_set_amount)}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => { setModal({ type: 'setTotal', investment: inv }); setModalAmount(inv.amount.toString()); }}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        + Set amount
                                                    </button>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span className={statusBadge(inv.status)}>
                                                    {inv.status === 'pending' && '⏳'}
                                                    {inv.status === 'approved' && '✅'}
                                                    {inv.status === 'rejected' && '❌'}
                                                    {' '}{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                                </span>
                                                {inv.admin_note && (
                                                    <p className="text-[11px] text-gray-400 mt-1 max-w-[160px] truncate" title={inv.admin_note}>
                                                        Note: {inv.admin_note}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(inv.created_at)}</p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {inv.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => setModal({ type: 'approve', investment: inv })}
                                                                disabled={actionLoading === inv.id}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                            >
                                                                ✓ Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setModal({ type: 'reject', investment: inv })}
                                                                disabled={actionLoading === inv.id}
                                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {inv.admin_set_amount && (
                                                        <button
                                                            onClick={() => { setModal({ type: 'setTotal', investment: inv }); setModalAmount(String(inv.admin_set_amount)); }}
                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                                        >
                                                            ✏ Edit Amount
                                                        </button>
                                                    )}
                                                    {restricted ? (
                                                        <button
                                                            onClick={() => handleUnrestrict(inv.user_id)}
                                                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                                        >
                                                            🔓 Unrestrict
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setModal({ type: 'restrict', investment: inv })}
                                                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                                        >
                                                            🚫 Restrict
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Restricted Users Panel */}
            {restrictions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                        <h3 className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                            🚫 Currently Restricted Investors ({restrictions.length})
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {restrictions.map(r => (
                            <div key={r.id} className="border border-red-200 dark:border-red-800 rounded-xl p-4">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.user_id}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reason: {r.reason || 'Not specified'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Since {fmtDate(r.restricted_at)}</p>
                                <button
                                    onClick={() => handleUnrestrict(r.user_id)}
                                    className="mt-3 w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                >
                                    🔓 Remove Restriction
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Modals ─── */}
            {modal.type !== null && modal.investment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>

                        {/* Approve Modal */}
                        {modal.type === 'approve' && (
                            <>
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl mb-5">✅</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Approve Investment</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                                    Approving <strong className="text-gray-900 dark:text-white">{fmt(modal.investment.amount)}</strong> by{' '}
                                    <strong className="text-gray-900 dark:text-white">{modal.investment.users?.full_name || modal.investment.user_name}</strong>
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    in <strong className="text-gray-900 dark:text-white">{modal.investment.properties?.title || modal.investment.property_title}</strong>
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Note (optional)</label>
                                <textarea
                                    rows={3}
                                    value={modalNote}
                                    onChange={e => setModalNote(e.target.value)}
                                    placeholder="Add a note for internal records..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6 resize-none"
                                />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={handleApprove} disabled={actionLoading !== null} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                                        {actionLoading !== null ? 'Approving...' : 'Confirm Approve'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Reject Modal */}
                        {modal.type === 'reject' && (
                            <>
                                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl mb-5">❌</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reject Investment</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    Rejecting investment request from <strong className="text-gray-900 dark:text-white">{modal.investment.users?.full_name || modal.investment.user_name}</strong>
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for rejection <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={3}
                                    value={modalNote}
                                    onChange={e => setModalNote(e.target.value)}
                                    placeholder="Explain why this investment is being rejected..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 resize-none"
                                />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={handleReject} disabled={actionLoading !== null || !modalNote.trim()} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                                        {actionLoading !== null ? 'Rejecting...' : 'Confirm Reject'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Restrict Modal */}
                        {modal.type === 'restrict' && (
                            <>
                                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🚫</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Restrict Investor</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    This will prevent <strong className="text-gray-900 dark:text-white">{modal.investment.users?.full_name || modal.investment.user_name}</strong> from making any new investment requests.
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={3}
                                    value={restrictReason}
                                    onChange={e => setRestrictReason(e.target.value)}
                                    placeholder="Enter reason for restricting this user..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-6 resize-none"
                                />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={handleRestrict} disabled={actionLoading !== null || !restrictReason.trim()} className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                                        {actionLoading !== null ? 'Restricting...' : 'Restrict User'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Set Total Amount Modal */}
                        {modal.type === 'setTotal' && (
                            <>
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-5">💰</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Set Investment Amount</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                                    User requested: <strong className="text-gray-900 dark:text-white">{fmt(modal.investment.amount)}</strong>
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    You can set a custom approved amount for this investment.
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Approved Amount (PKR) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={modalAmount}
                                    onChange={e => setModalAmount(e.target.value)}
                                    placeholder="Enter amount in PKR"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                                />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={handleSetTotal} disabled={actionLoading !== null || !modalAmount} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                                        {actionLoading !== null ? 'Saving...' : 'Save Amount'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
