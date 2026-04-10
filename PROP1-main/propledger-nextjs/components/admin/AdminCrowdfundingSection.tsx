'use client';

import { useState, useEffect, useCallback } from 'react';

interface CrowdfundingRequest {
    id: number;
    user_id: string;
    campaign_id: number;
    campaign_title: string;
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

type ModalType = 'approve' | 'reject' | 'restrict' | 'setAmount' | null;

export default function AdminCrowdfundingSection() {
    const [requests, setRequests] = useState<CrowdfundingRequest[]>([]);
    const [restrictions, setRestrictions] = useState<Restriction[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const [modal, setModal] = useState<{ type: ModalType; request: CrowdfundingRequest | null }>({ type: null, request: null });
    const [modalNote, setModalNote] = useState('');
    const [modalAmount, setModalAmount] = useState('');
    const [restrictReason, setRestrictReason] = useState('');

    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/crowdfunding');
            const data = await res.json();
            if (data.success) {
                setRequests(data.requests);
                setRestrictions(data.restrictions);
            }
        } catch {
            showToast('Failed to load crowdfunding data', false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const isRestricted = (userId: string) => restrictions.some(r => r.user_id === userId && r.is_active);

    const post = async (payload: object): Promise<boolean> => {
        setActionLoading((payload as any).request_id ?? -1);
        try {
            const res = await fetch('/api/admin/crowdfunding', {
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
        setModal({ type: null, request: null });
        setModalNote(''); setModalAmount(''); setRestrictReason('');
    };

    const handleApprove = async () => {
        if (!modal.request) return;
        const ok = await post({ action: 'approve', request_id: modal.request.id, admin_note: modalNote });
        if (ok) { closeModal(); fetchData(); }
    };

    const handleReject = async () => {
        if (!modal.request) return;
        const ok = await post({ action: 'reject', request_id: modal.request.id, admin_note: modalNote });
        if (ok) { closeModal(); fetchData(); }
    };

    const handleRestrict = async () => {
        if (!modal.request) return;
        const ok = await post({ action: 'restrict', user_id: modal.request.user_id, reason: restrictReason });
        if (ok) { closeModal(); fetchData(); }
    };

    const handleUnrestrict = async (userId: string) => {
        const ok = await post({ action: 'unrestrict', user_id: userId });
        if (ok) fetchData();
    };

    const handleSetAmount = async () => {
        if (!modal.request || !modalAmount) return;
        const ok = await post({ action: 'set_amount', request_id: modal.request.id, admin_set_amount: modalAmount });
        if (ok) { closeModal(); fetchData(); }
    };

    const filtered = requests.filter(r => statusFilter === 'all' ? true : r.status === statusFilter);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const statusBadge = (status: string) => {
        const cfg: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-800 border border-amber-200',
            approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            rejected: 'bg-red-100 text-red-800 border border-red-200',
        };
        return `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg[status] || ''}`;
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    <span>{toast.ok ? '✓' : '✕'}</span>
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Crowdfunding Requests
                        {pendingCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                                {pendingCount} pending
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Review and manage user crowdfunding contribution requests.
                    </p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requests', value: requests.length, color: 'text-gray-900 dark:text-white', bg: 'bg-white dark:bg-gray-800' },
                    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
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
                    <button key={f} onClick={() => setStatusFilter(f)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${statusFilter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== 'all' && <span className="ml-2 opacity-70">{requests.filter(r => r.status === f).length}</span>}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🧩</div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No {statusFilter !== 'all' ? statusFilter : ''} crowdfunding requests</h3>
                        <p className="text-gray-400 text-sm mt-1">Contribution requests from users will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                    {['Contributor', 'Campaign', 'Amount', 'Admin Amount', 'Status', 'Date', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {filtered.map(req => {
                                    const restricted = isRestricted(req.user_id);
                                    return (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                            {/* Contributor */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {(req.users?.full_name || req.user_name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.users?.full_name || req.user_name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{req.users?.email || req.user_email || '—'}</p>
                                                        {restricted && (
                                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">🚫 Restricted</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Campaign */}
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{req.properties?.title || req.campaign_title || `#${req.campaign_id}`}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{req.properties?.location || '—'}</p>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(req.amount)}</span>
                                            </td>

                                            {/* Admin Amount */}
                                            <td className="px-5 py-4">
                                                {req.admin_set_amount ? (
                                                    <button onClick={() => { setModal({ type: 'setAmount', request: req }); setModalAmount(String(req.admin_set_amount)); }}
                                                        className="text-sm font-bold text-emerald-600 hover:underline">{fmt(req.admin_set_amount)}</button>
                                                ) : (
                                                    <button onClick={() => { setModal({ type: 'setAmount', request: req }); setModalAmount(req.amount.toString()); }}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Set amount</button>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span className={statusBadge(req.status)}>
                                                    {req.status === 'pending' && '⏳'}
                                                    {req.status === 'approved' && '✅'}
                                                    {req.status === 'rejected' && '❌'}
                                                    {' '}{req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                </span>
                                                {req.admin_note && <p className="text-[11px] text-gray-400 mt-1 max-w-[160px] truncate" title={req.admin_note}>Note: {req.admin_note}</p>}
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(req.created_at)}</p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => setModal({ type: 'approve', request: req })} disabled={actionLoading === req.id}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">✓ Approve</button>
                                                            <button onClick={() => setModal({ type: 'reject', request: req })} disabled={actionLoading === req.id}
                                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">✕ Reject</button>
                                                        </>
                                                    )}
                                                    {restricted ? (
                                                        <button onClick={() => handleUnrestrict(req.user_id)}
                                                            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors">🔓 Unrestrict</button>
                                                    ) : (
                                                        <button onClick={() => setModal({ type: 'restrict', request: req })}
                                                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors">🚫 Restrict</button>
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

            {/* ─── Modals ─── */}
            {modal.type !== null && modal.request && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>

                        {/* Approve */}
                        {modal.type === 'approve' && (
                            <>
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl mb-5">✅</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Approve Contribution</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    Approving <strong className="text-gray-900 dark:text-white">{fmt(modal.request.amount)}</strong> from{' '}
                                    <strong className="text-gray-900 dark:text-white">{modal.request.users?.full_name || modal.request.user_name}</strong> for{' '}
                                    <strong className="text-gray-900 dark:text-white">{modal.request.properties?.title || modal.request.campaign_title}</strong>
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Note (optional)</label>
                                <textarea rows={3} value={modalNote} onChange={e => setModalNote(e.target.value)}
                                    placeholder="Add a note for internal records..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6 resize-none" />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={handleApprove} disabled={actionLoading !== null} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                                        {actionLoading !== null ? 'Approving...' : 'Confirm Approve'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Reject */}
                        {modal.type === 'reject' && (
                            <>
                                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl mb-5">❌</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reject Contribution</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    Rejecting request from <strong className="text-gray-900 dark:text-white">{modal.request.users?.full_name || modal.request.user_name}</strong>
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-red-500">*</span></label>
                                <textarea rows={3} value={modalNote} onChange={e => setModalNote(e.target.value)}
                                    placeholder="Explain why this contribution is being rejected..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 resize-none" />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={handleReject} disabled={actionLoading !== null || !modalNote.trim()} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                                        {actionLoading !== null ? 'Rejecting...' : 'Confirm Reject'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Restrict */}
                        {modal.type === 'restrict' && (
                            <>
                                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🚫</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Restrict User</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    This will prevent <strong className="text-gray-900 dark:text-white">{modal.request.users?.full_name || modal.request.user_name}</strong> from making any new crowdfunding or investment requests.
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-red-500">*</span></label>
                                <textarea rows={3} value={restrictReason} onChange={e => setRestrictReason(e.target.value)}
                                    placeholder="Enter reason for restricting this user..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-6 resize-none" />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={handleRestrict} disabled={actionLoading !== null || !restrictReason.trim()} className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                                        {actionLoading !== null ? 'Restricting...' : 'Restrict User'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Set Amount */}
                        {modal.type === 'setAmount' && (
                            <>
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-5">💰</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Set Approved Amount</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                                    User requested: <strong className="text-gray-900 dark:text-white">{fmt(modal.request.amount)}</strong>. You can set a custom approved contribution amount.
                                </p>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Approved Amount (PKR) <span className="text-red-500">*</span></label>
                                <input type="number" value={modalAmount} onChange={e => setModalAmount(e.target.value)}
                                    placeholder="Enter approved amount"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6" />
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={handleSetAmount} disabled={actionLoading !== null || !modalAmount} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
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
