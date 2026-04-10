'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TokenTransactions from '@/components/TokenTransactions';
import Chatbot from "../../components/ai-chatbot/components/Chatbot";
interface User {
  id: number;
  name: string;
  email: string;
  type: string;
}

interface Message {
  id: number;
  manager_name: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  reply_message?: string;
  replied_at?: string;
}

interface InvestmentRequest {
  id: number;
  property_id: number;
  property_title: string;
  amount: number;
  admin_set_amount: number | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  properties?: {
    id: number;
    title: string;
    location: string;
    image_url: string | null;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Investment requests state
  const [investmentRequests, setInvestmentRequests] = useState<InvestmentRequest[]>([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);
  const [newApprovals, setNewApprovals] = useState(0);

  // Crowdfunding requests state
  const [crowdfundingRequests, setCrowdfundingRequests] = useState<InvestmentRequest[]>([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [newCfApprovals, setNewCfApprovals] = useState(0);

  const fetchInvestmentRequests = useCallback(async (userId: number) => {
    setInvestmentsLoading(true);
    try {
      const res = await fetch(`/api/investments/request?user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        const prev = investmentRequests;
        const newlyApproved = (data.requests as InvestmentRequest[]).filter(
          r => r.status === 'approved' && !prev.find(p => p.id === r.id && p.status === 'approved')
        ).length;
        if (newlyApproved > 0) setNewApprovals(n => n + newlyApproved);
        setInvestmentRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching investment requests:', err);
    } finally {
      setInvestmentsLoading(false);
    }
  }, [investmentRequests]);

  const fetchCrowdfundingRequests = useCallback(async (userId: number) => {
    setCfLoading(true);
    try {
      const res = await fetch(`/api/crowdfunding/request?user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        const prev = crowdfundingRequests;
        const newlyApproved = (data.requests as InvestmentRequest[]).filter(
          r => r.status === 'approved' && !prev.find(p => p.id === r.id && p.status === 'approved')
        ).length;
        if (newlyApproved > 0) setNewCfApprovals(n => n + newlyApproved);
        setCrowdfundingRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching crowdfunding requests:', err);
    } finally {
      setCfLoading(false);
    }
  }, [crowdfundingRequests]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchInvestmentRequests(user.id);
      fetchCrowdfundingRequests(user.id);
    }
  }, [user]);

  // Poll investment requests every 8 seconds
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => fetchInvestmentRequests(user.id), 8000);
    return () => clearInterval(iv);
  }, [user]);

  // Poll crowdfunding requests every 8 seconds
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => fetchCrowdfundingRequests(user.id), 8000);
    return () => clearInterval(iv);
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    setMessagesLoading(true);
    try {
      // Use Supabase API with user_id parameter for localStorage auth
      const response = await fetch(`/api/messages/user?user_id=${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      console.log('User messages response:', data); // Debug log

      if (data.success && data.messages) {
        setMessages(data.messages);
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleReply = async (msg: Message) => {
    if (!replyText.trim()) return;

    try {
      setReplyLoading(true);
      setReplyError('');

      const payload = {
        manager: msg.manager_name,
        subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
        message: replyText,
        priority: 'normal',
        user_id: user?.id.toString(), // Include user_id for localStorage auth
      };

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setReplyingTo(null);
        setReplyText('');
        setReplyError('');
        await fetchMessages();
      } else {
        setReplyError(data.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Reply send error:', error);
      setReplyError('Connection error. Failed to send reply.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchMessages();
      } else {
        alert(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Connection error. Failed to delete message.');
    }
  };

  const checkAuth = async () => {
    try {
      // First check localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser({
          id: userData.id,
          name: userData.full_name || userData.name,
          email: userData.email,
          type: userData.user_type || userData.type
        });
        setLoading(false);
        return;
      }

      // If no localStorage, check PHP backend session
      const response = await fetch('http://localhost/PROPLEDGER/auth/check_session.php', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Store in localStorage for future use
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser({
          id: data.user.id,
          name: data.user.full_name || data.user.name,
          email: data.user.email,
          type: data.user.user_type || data.user.type
        });
      } else {
        console.log('No active session');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-xl font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-md border border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, <span className="text-blue-600">{user?.name}</span>!
            </h1>
            <p className="text-gray-500">
              Manage your investments and track your portfolio performance
            </p>
          </div>
          <div className="hidden md:block text-5xl">
            👋
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm mb-2 font-medium">Total Investment</div>
            <div className="text-3xl font-bold text-gray-900">₨ 0</div>
            <div className="text-green-600 text-sm mt-2 flex items-center gap-1">
              <span>↑</span> +0% this month
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm mb-2 font-medium">PROP Tokens</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-gray-400 text-sm mt-2">1 PROP = ₨1,000</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm mb-2 font-medium">Properties Owned</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-gray-400 text-sm mt-2">Active investments</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-sm mb-2 font-medium">Total ROI</div>
            <div className="text-3xl font-bold text-green-600">0%</div>
            <div className="text-gray-400 text-sm mt-2">Lifetime returns</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid ${user?.type === 'agent' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 mb-8`}>
          {/* Only show Buy Tokens for non-agent users */}
          {user?.type !== 'agent' && (
            <Link href="/buy-tokens" className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all cursor-pointer block group">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform text-blue-600">
                🪙
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Buy Tokens</h3>
              <p className="text-gray-500 text-sm">Purchase PROP tokens to start investing in real estate</p>
            </Link>
          )}
          <Link href="/properties" className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all cursor-pointer block group">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform text-teal-600">
              🏢
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Properties</h3>
            <p className="text-gray-500 text-sm">Explore verified listing and investment opportunities</p>
          </Link>
          <Link href="/investments" className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all cursor-pointer block group">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform text-purple-600">
              📊
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Portfolio</h3>
            <p className="text-gray-500 text-sm">View your detailed investment portfolio analytics</p>
          </Link>
        </div>

        {/* ─── Investment Notifications ─── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Investment Requests</h2>
              {investmentRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full animate-pulse">
                  {investmentRequests.filter(r => r.status === 'pending').length} pending
                </span>
              )}
              {investmentRequests.filter(r => r.status === 'approved').length > 0 && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  {investmentRequests.filter(r => r.status === 'approved').length} approved ✓
                </span>
              )}
            </div>
            <Link
              href="/investments"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Browse Investments →
            </Link>
          </div>

          {/* New approval flash */}
          {newApprovals > 0 && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 animate-pulse">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-emerald-800">Investment Request Approved!</p>
                <p className="text-sm text-emerald-700">
                  {newApprovals} request{newApprovals > 1 ? 's have' : ' has'} been approved. You can now proceed to invest.
                </p>
              </div>
              <button onClick={() => setNewApprovals(0)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-xl">×</button>
            </div>
          )}

          {investmentsLoading && investmentRequests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : investmentRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <div className="text-5xl mb-3 text-gray-300">📊</div>
              <p className="text-gray-500 font-medium">No investment requests yet</p>
              <p className="text-gray-400 text-sm mt-1">Browse investment opportunities and submit a request to get started</p>
              <Link href="/investments" className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                Browse Investments
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {investmentRequests.map((req) => {
                const finalAmount = req.admin_set_amount || req.amount;
                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border p-5 transition-all ${req.status === 'approved'
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                      : req.status === 'pending'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Property name */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {req.status === 'approved' ? '✅' : req.status === 'pending' ? '⏳' : '❌'}
                          </span>
                          <h3 className="font-bold text-gray-900">
                            {req.properties?.title || req.property_title || `Property #${req.property_id}`}
                          </h3>
                        </div>

                        {/* Amounts row */}
                        <div className="flex flex-wrap gap-4 text-sm mb-2">
                          <div>
                            <span className="text-gray-500">You requested:</span>{' '}
                            <span className="font-semibold text-gray-800">PKR {req.amount.toLocaleString()}</span>
                          </div>
                          {req.admin_set_amount && req.admin_set_amount !== req.amount && (
                            <div>
                              <span className="text-gray-500">Admin approved:</span>{' '}
                              <span className="font-bold text-emerald-700">PKR {req.admin_set_amount.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Admin note */}
                        {req.admin_note && (
                          <div className={`text-xs p-2 rounded-lg mt-2 ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            Admin note: {req.admin_note}
                          </div>
                        )}

                        {/* Date */}
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted: {new Date(req.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {req.reviewed_at && ` · Reviewed: ${new Date(req.reviewed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`}
                        </p>
                      </div>

                      {/* Status badge + action */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${req.status === 'approved'
                          ? 'bg-emerald-200 text-emerald-800'
                          : req.status === 'pending'
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-red-200 text-red-800'
                          }`}>
                          {req.status}
                        </span>

                        {req.status === 'approved' && (
                          <Link
                            href={`/investments/${req.property_id}`}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                          >
                            🚀 Invest Now
                          </Link>
                        )}

                        {req.status === 'rejected' && (
                          <Link
                            href={`/investments/${req.property_id}`}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            🔄 Try Again
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Crowdfunding Requests ─── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Crowdfunding Contributions</h2>
              {crowdfundingRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full animate-pulse">
                  {crowdfundingRequests.filter(r => r.status === 'pending').length} pending
                </span>
              )}
              {crowdfundingRequests.filter(r => r.status === 'approved').length > 0 && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  {crowdfundingRequests.filter(r => r.status === 'approved').length} approved ✓
                </span>
              )}
            </div>
            <Link
              href="/crowdfunding"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Browse Campaigns →
            </Link>
          </div>

          {/* New crowdfunding approval flash */}
          {newCfApprovals > 0 && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 animate-pulse">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-emerald-800">Crowdfunding Contribution Approved!</p>
                <p className="text-sm text-emerald-700">
                  {newCfApprovals} contribution{newCfApprovals > 1 ? 's have' : ' has'} been approved. You can now proceed to contribute.
                </p>
              </div>
              <button onClick={() => setNewCfApprovals(0)} className="ml-auto text-emerald-500 hover:text-emerald-700 text-xl">×</button>
            </div>
          )}

          {cfLoading && crowdfundingRequests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : crowdfundingRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <div className="text-5xl mb-3 text-gray-300">🧩</div>
              <p className="text-gray-500 font-medium">No crowdfunding contributions yet</p>
              <p className="text-gray-400 text-sm mt-1">Browse active campaigns and submit a contribution request</p>
              <Link href="/crowdfunding" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                Browse Campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {crowdfundingRequests.map((req) => (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-5 transition-all ${req.status === 'approved'
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                      : req.status === 'pending'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Campaign name */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {req.status === 'approved' ? '✅' : req.status === 'pending' ? '⏳' : '❌'}
                        </span>
                        <h3 className="font-bold text-gray-900">
                          {(req as any).properties?.title || (req as any).campaign_title || `Campaign #${req.property_id}`}
                        </h3>
                      </div>

                      {/* Amounts */}
                      <div className="flex flex-wrap gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">You requested:</span>{' '}
                          <span className="font-semibold text-gray-800">PKR {req.amount.toLocaleString()}</span>
                        </div>
                        {req.admin_set_amount && req.admin_set_amount !== req.amount && (
                          <div>
                            <span className="text-gray-500">Admin approved:</span>{' '}
                            <span className="font-bold text-emerald-700">PKR {req.admin_set_amount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Admin note */}
                      {req.admin_note && (
                        <div className={`text-xs p-2 rounded-lg mt-2 ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          Admin note: {req.admin_note}
                        </div>
                      )}

                      {/* Dates */}
                      <p className="text-xs text-gray-400 mt-2">
                        Submitted: {new Date(req.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {req.reviewed_at && ` · Reviewed: ${new Date(req.reviewed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>

                    {/* Status badge + CTA */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${req.status === 'approved'
                          ? 'bg-emerald-200 text-emerald-800'
                          : req.status === 'pending'
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                        {req.status}
                      </span>
                      {req.status === 'approved' && (
                        <Link
                          href={`/crowdfunding/${req.property_id}`}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                        >
                          🚀 Contribute Now
                        </Link>
                      )}
                      {req.status === 'rejected' && (
                        <Link
                          href={`/crowdfunding/${req.property_id}`}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          🔄 Try Again
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Messages from Portfolio Managers</h2>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>↻</span> Refresh
            </button>
          </div>

          {messagesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className="text-gray-400 mt-4">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <div className="text-4xl mb-4 text-gray-300">💬</div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Contact a portfolio manager to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bg-white border ${msg.status === 'unread' ? 'border-l-4 border-l-blue-500 border-gray-200 shadow-md' : 'border-gray-200'} rounded-xl p-6 transition-all`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold ${msg.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>{msg.subject}</h3>
                      {msg.status === 'unread' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">New</span>
                      )}
                      {msg.status === 'replied' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Replied</span>
                      )}
                      {msg.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">High Priority</span>
                      )}
                      {msg.priority === 'urgent' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Urgent</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">To: <span className="font-medium text-gray-700">{msg.manager_name}</span></p>
                  <p className="text-gray-600 mb-4 leading-relaxed">{msg.message}</p>

                  {msg.reply_message && (
                    <div className="mt-4 border-l-2 border-blue-200 bg-blue-50/50 p-4 rounded-r-xl">
                      <p className="text-blue-800 text-sm font-bold mb-1">Reply from {msg.manager_name}:</p>
                      <p className="text-gray-700">{msg.reply_message}</p>
                      {msg.replied_at && (
                        <p className="text-gray-400 text-xs mt-2">Replied on {new Date(msg.replied_at).toLocaleString()}</p>
                      )}
                    </div>
                  )}

                  {replyingTo === msg.id ? (
                    <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl">
                      {replyError && (
                        <div className="text-red-500 text-sm font-medium">{replyError}</div>
                      )}
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply to this manager..."
                        rows={4}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none transition-all"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(msg)}
                          disabled={replyLoading || !replyText.trim()}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-sm"
                        >
                          {replyLoading ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                            setReplyError('');
                          }}
                          className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setReplyingTo(msg.id);
                          setReplyText('');
                          setReplyError('');
                        }}
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-lg text-sm font-medium transition-all"
                      >
                        ↩ Reply
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-lg text-sm font-medium transition-all"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Token Transactions - This component needs update too if it's separate */}
        <div className="mb-8">
          {/* Assuming TokenTransactions handles its own styling, likely needs a separate refactor if shared */}
          {/* For now we just wrap it to ensure spacing */}
          <TokenTransactions />
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <div className="text-5xl mb-4 text-gray-300">📭</div>
            <p className="text-gray-500 font-medium">No recent activity</p>
            <p className="text-gray-400 text-sm mt-1">Start investing to see your activity here</p>
          </div>
        </div>
      </div>
       {/* 🔥 CHATBOT (SAFE ADDITION) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </div>
  );
}
