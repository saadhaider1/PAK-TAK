'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Campaign {
  id: string;
  image: string;
  icon?: string;
  title: string;
  category: string;
  location: string;
  description: string;
  fullDescription: string;
  targetAmount: string;
  targetNumeric: number;
  raisedAmount: string;
  raisedNumeric: number;
  investors: number;
  minInvestment: string;
  minInvestmentNumeric: number;
  expectedROI: string;
  duration: string;
  endDate: string;
  features: string[];
  updates: { date: string; title: string; content: string }[];
  documents: { name: string; url: string }[];
}

interface CrowdfundingRequest {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  admin_set_amount: number | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Static sample campaigns (would be replaced with API in a full build)
const SAMPLE_CAMPAIGNS: Record<string, Campaign> = {
  '1': {
    id: '1', image: '/images/property1.jpg', icon: '🏠',
    title: 'Property Share',
    category: 'Real Estate Ownership Made Easy',
    location: 'Arif Habib Dolmen REIT Management Limited',
    description: 'Bite-sized way to invest in high-value real estate.',
    fullDescription: 'Property Share by Dolmen REIT is a groundbreaking crowdfunding campaign that democratizes real estate investment. By pooling resources from multiple investors, we can collectively own premium commercial properties that would otherwise be out of reach. Each investor receives proportional ownership tokens and shares in rental income and property appreciation.',
    targetAmount: 'PKR 50,000,000', targetNumeric: 50000000,
    raisedAmount: 'PKR 35,000,000', raisedNumeric: 35000000,
    investors: 245, minInvestment: 'PKR 100,000', minInvestmentNumeric: 100000,
    expectedROI: '16% annually', duration: '3 Years', endDate: 'December 31, 2025',
    features: ['Collective Ownership Model', 'Regular Income Distribution', 'Professional Property Management', 'Blockchain-Verified Shares', 'Quarterly Performance Reports', 'Exit Strategy After 3 Years'],
    updates: [
      { date: 'Nov 1, 2025', title: 'Campaign 70% Funded!', content: 'We have reached 70% of our funding goal with 245 investors.' },
      { date: 'Oct 15, 2025', title: 'Property Inspection Completed', content: 'Independent valuation and inspection completed.' },
    ],
    documents: [{ name: 'Campaign Prospectus', url: '#' }, { name: 'Property Valuation Report', url: '#' }, { name: 'Legal Agreement', url: '#' }, { name: 'CDA Approval', url: '#' }],
  },
  '2': {
    id: '2', image: '/images/property2.jpg', icon: '🏨',
    title: 'Serene Heights Hotel & Resort',
    category: 'Hospitality',
    location: 'Nathia Gali, Khyber Pakhtunkhwa',
    description: 'Luxury hotel and resort spanning 2.5 acres with 50 rooms.',
    fullDescription: 'Serene Heights is an exciting hospitality crowdfunding opportunity in the scenic Nathia Gali region. With 50 well-appointed rooms, spa facilities, and conference halls, this property generates year-round revenue from both leisure and business travelers.',
    targetAmount: 'PKR 80,000,000', targetNumeric: 80000000,
    raisedAmount: 'PKR 62,000,000', raisedNumeric: 62000000,
    investors: 412, minInvestment: 'PKR 150,000', minInvestmentNumeric: 150000,
    expectedROI: '18% annually', duration: '5 Years', endDate: 'January 15, 2026',
    features: ['50 Luxury Rooms', 'Full-Service Spa', 'Conference Facilities', 'Restaurant & Bar', 'Year-Round Operations', 'Experienced Hotel Management'],
    updates: [
      { date: 'Oct 28, 2025', title: 'Over 400 Investors!', content: 'We have crossed 400 investors and raised over PKR 62 million.' },
      { date: 'Oct 10, 2025', title: 'Hotel License Approved', content: 'All necessary licenses and permits have been approved by local authorities.' },
    ],
    documents: [{ name: 'Investment Prospectus', url: '#' }, { name: 'Hotel License', url: '#' }, { name: 'Revenue Projections', url: '#' }, { name: 'Management Agreement', url: '#' }],
  },
};

export default function CrowdfundingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'documents'>('overview');

  // Request status
  const [requestStatus, setRequestStatus] = useState<CrowdfundingRequest | null>(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error' | 'restricted'; msg: string } | null>(null);

  // ─── Fetch campaign (try API first, fallback to sample) ──────────────────
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/properties?id=${params.id}`);
        const data = await res.json();
        if (data.success) {
          const prop = data.properties?.find((p: any) => p.id.toString() === params.id &&
            (p.property_type === 'land' || p.property_type === 'mixed'));
          if (prop) {
            // ── Parse CF_STATS from description (written by admin on approval) ──
            const desc = prop.description || '';
            let totalRaised = 0;
            let uniqueFunders = 0;
            const cfStart = desc.indexOf('[CF_STATS]');
            const cfEnd = desc.indexOf('[/CF_STATS]');
            if (cfStart !== -1 && cfEnd !== -1) {
              try {
                const stats = JSON.parse(desc.slice(cfStart + 10, cfEnd));
                totalRaised = stats.total_raised || 0;
                uniqueFunders = stats.unique_funders || 0;
              } catch { /* ignore */ }
            }
            // Fallback calculation if no CF_STATS yet
            if (totalRaised === 0) {
              totalRaised = ((prop.total_tokens - prop.available_tokens) / prop.total_tokens) * prop.price;
            }

            // Strip all metadata blocks from description for clean display
            const stripBlock = (s: string, tag: string) => {
              const open = `[${tag}]`, close = `[/${tag}]`;
              let result = s;
              while (result.includes(open) && result.includes(close)) {
                const start = result.indexOf(open);
                const end = result.indexOf(close) + close.length;
                result = result.slice(0, start) + result.slice(end);
              }
              return result.trim();
            };
            const cleanDesc = stripBlock(stripBlock(stripBlock(desc, 'CF_STATS'), 'METADATA'), 'DOCUMENTS');

            setCampaign({
              id: prop.id.toString(),
              image: prop.image_url || '/images/property-placeholder.jpg',
              icon: '🧩',
              title: prop.title,
              category: prop.property_type === 'land' ? 'Land Development' : 'Mixed Development',
              location: prop.location,
              description: cleanDesc,
              fullDescription: cleanDesc,
              targetAmount: `PKR ${prop.price.toLocaleString()}`,
              targetNumeric: prop.price,
              raisedAmount: `PKR ${Math.round(totalRaised).toLocaleString()}`,
              raisedNumeric: Math.round(totalRaised),
              investors: uniqueFunders || 0,
              minInvestment: `PKR ${prop.token_price.toLocaleString()}`,
              minInvestmentNumeric: prop.token_price,
              expectedROI: prop.returns || '14–18%',
              duration: prop.duration || '3–5 Years',
              endDate: 'December 31, 2025',
              features: prop.key_features || [],
              updates: [],
              documents: prop.documents || [],
            });
            return;
          }
        }
      } catch { /* fallback below */ }

      // Fallback to static sample data
      const sample = SAMPLE_CAMPAIGNS[params.id as string];
      if (sample) setCampaign(sample);
    };
    fetchCampaign();
    // Also poll campaign stats every 10s to pick up admin approvals in real-time
    const iv = setInterval(fetchCampaign, 10000);
    return () => clearInterval(iv);
  }, [params.id]);

  // ─── Poll request status every 8 seconds ─────────────────────────────────
  const checkRequestStatus = useCallback(async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { setCheckingStatus(false); return; }
    const userData = JSON.parse(storedUser);

    try {
      const res = await fetch(`/api/crowdfunding/request?user_id=${userData.id}&campaign_id=${params.id}`);
      const data = await res.json();
      if (data.success) {
        setIsRestricted(data.is_restricted);
        setRestrictionReason(data.restriction_reason || '');
        setRequestStatus(data.requests?.[0] || null);
      }
    } catch (err) {
      console.error('Error checking crowdfunding status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }, [params.id]);

  useEffect(() => {
    checkRequestStatus();
    const iv = setInterval(checkRequestStatus, 8000);
    return () => clearInterval(iv);
  }, [checkRequestStatus]);

  // ─── Submit contribution request ──────────────────────────────────────────
  const handleSubmitRequest = async () => {
    if (!investmentAmount) { alert('Please enter an investment amount'); return; }
    const amount = parseInt(investmentAmount);
    if (amount < campaign!.minInvestmentNumeric) {
      alert(`Minimum contribution is ${campaign!.minInvestment}`);
      return;
    }
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { alert('You must be logged in to contribute.'); return; }
    const userData = JSON.parse(storedUser);

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/crowdfunding/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.id,
          campaign_id: params.id,
          campaign_title: campaign!.title,
          amount,
          user_name: userData.full_name || userData.name,
          user_email: userData.email,
        }),
      });
      const data = await res.json();
      if (data.restricted) {
        setIsRestricted(true);
        setRestrictionReason(data.message);
        setSubmitResult({ type: 'restricted', msg: data.message });
      } else if (data.success) {
        setSubmitResult({ type: 'success', msg: `Your contribution of PKR ${amount.toLocaleString()} has been submitted and is awaiting admin approval.` });
        setInvestmentAmount('');
        await checkRequestStatus();
      } else {
        setSubmitResult({ type: 'error', msg: data.message || 'Failed to submit. Try again.' });
      }
    } catch {
      setSubmitResult({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToContribute = () => {
    const approvedAmount = requestStatus?.admin_set_amount || requestStatus?.amount || 0;
    router.push(`/checkout?campaign=${params.id}&amount=${approvedAmount}&type=crowdfunding&request_id=${requestStatus?.id}`);
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  const fundingPercentage = Math.min((campaign.raisedNumeric / campaign.targetNumeric) * 100, 100);
  const remainingAmount = campaign.targetNumeric - campaign.raisedNumeric;
  const approvedAmount = requestStatus?.admin_set_amount || requestStatus?.amount;
  const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

  // ─── Sidebar card states ──────────────────────────────────────────────────
  const renderContributionCard = () => {
    if (isRestricted) return (
      <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-center">
        <div className="text-4xl mb-3">🚫</div>
        <h4 className="font-bold text-red-800 text-lg mb-2">Investing Restricted</h4>
        <p className="text-red-600 text-sm">{restrictionReason || 'Your account has been restricted from making contribution requests. Please contact admin.'}</p>
      </div>
    );

    if (checkingStatus) return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

    // ── Approved ────────────────────────────────────────────────────────
    if (requestStatus?.status === 'approved') return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-emerald-800">Contribution Approved!</p>
              <p className="text-xs text-emerald-600">Admin has approved your request</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-200">
            <p className="text-sm text-emerald-700">Approved Amount:</p>
            <p className="text-2xl font-bold text-emerald-700">{fmt(approvedAmount!)}</p>
            {requestStatus?.admin_set_amount && requestStatus.admin_set_amount !== requestStatus.amount && (
              <p className="text-xs text-emerald-600 mt-1">You requested {fmt(requestStatus.amount)}, admin set {fmt(requestStatus.admin_set_amount)}</p>
            )}
            {requestStatus?.admin_note && (
              <p className="mt-2 text-xs text-emerald-700 bg-emerald-100 p-2 rounded-lg">Admin note: {requestStatus.admin_note}</p>
            )}
          </div>
        </div>
        <button onClick={handleProceedToContribute}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          🚀 Contribute Now — {fmt(approvedAmount!)}
        </button>
        <p className="text-center text-xs text-gray-400">Your contribution request is approved. Click to proceed.</p>
      </div>
    );

    // ── Pending ─────────────────────────────────────────────────────────
    if (requestStatus?.status === 'pending') return (
      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <h4 className="font-bold text-amber-800 text-lg mb-1">Request Pending</h4>
          <p className="text-amber-700 text-sm mb-3">Your contribution of <strong>{fmt(requestStatus.amount)}</strong> is awaiting admin review.</p>
          <p className="text-xs text-amber-600">Submitted: {new Date(requestStatus.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This page auto-refreshes. You'll see a green button as soon as admin approves.
        </div>
      </div>
    );

    // ── Rejected ────────────────────────────────────────────────────────
    if (requestStatus?.status === 'rejected') return (
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold text-red-800">Request Rejected</p>
              <p className="text-xs text-red-600">{new Date(requestStatus.reviewed_at || requestStatus.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {requestStatus.admin_note && <p className="text-sm text-red-700 bg-red-100 p-2 rounded-lg mt-2">Reason: {requestStatus.admin_note}</p>}
          <p className="mt-2 text-xs text-red-600">You can submit a new contribution request below.</p>
        </div>
        {renderContributionForm('Re-submit Contribution Request')}
      </div>
    );

    // ── No request yet ───────────────────────────────────────────────────
    return renderContributionForm('Submit Contribution Request');
  };

  const renderContributionForm = (btnLabel: string) => (
    <div className="space-y-5">
      <h3 className="text-xl font-bold text-gray-900">Join This Campaign</h3>

      {/* Campaign Stats */}
      <div className="p-4 bg-blue-50 rounded-xl">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Min. Contribution:</span>
          <span className="font-semibold text-gray-900">{campaign!.minInvestment}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Expected ROI:</span>
          <span className="font-semibold text-green-600">{campaign!.expectedROI}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Duration:</span>
          <span className="font-semibold text-gray-900">{campaign!.duration}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">End Date:</span>
          <span className="font-semibold text-gray-900">{campaign!.endDate}</span>
        </div>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Contribution Amount (PKR):</label>
        <input type="number" value={investmentAmount} onChange={e => setInvestmentAmount(e.target.value)}
          placeholder={`Min ${campaign!.minInvestment}`} min={campaign!.minInvestmentNumeric}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        {investmentAmount && parseInt(investmentAmount) >= campaign!.minInvestmentNumeric && (
          <div className="mt-3 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-gray-600">Your share:</p>
            <p className="text-base font-bold text-blue-600">
              {((parseInt(investmentAmount) / campaign!.targetNumeric) * 100).toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {/* Result banner */}
      {submitResult && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${submitResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : submitResult.type === 'restricted' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
          <p className="flex items-start gap-2">
            <span className="text-lg shrink-0">{submitResult.type === 'success' ? '✅' : submitResult.type === 'restricted' ? '🚫' : '⚠️'}</span>
            <span>{submitResult.msg}</span>
          </p>
        </div>
      )}

      {/* Submit button */}
      <button onClick={handleSubmitRequest} disabled={submitting}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {submitting ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : btnLabel}
      </button>
      <p className="text-center text-xs text-gray-400">⏳ Admin reviews &amp; approves all contributions</p>
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-96 bg-gray-900">
        <Image src={campaign.image} alt={campaign.title} fill className="object-cover opacity-70"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
          <Link href="/crowdfunding" className="text-white hover:text-blue-400 mb-4 inline-block">← Back to Crowdfunding</Link>
          <div className="flex items-start gap-4">
            {campaign.icon && <div className="text-6xl bg-white p-4 rounded-lg">{campaign.icon}</div>}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{campaign.title}</h1>
              <p className="text-gray-300 text-lg">{campaign.category}</p>
              <p className="text-gray-400">{campaign.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Funding Progress */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Raised</p>
                  <p className="text-2xl font-bold text-green-600">{campaign.raisedAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Target</p>
                  <p className="text-2xl font-bold text-gray-900">{campaign.targetAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Investors</p>
                  <p className="text-2xl font-bold text-blue-600">{campaign.investors}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${fundingPercentage}%` }} />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{fundingPercentage.toFixed(1)}% funded</span>
                <span>PKR {(remainingAmount / 1000000).toFixed(1)}M remaining</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-md mb-6">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {(['overview', 'updates', 'documents'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-6 py-4 font-semibold capitalize ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About This Campaign</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">{campaign.fullDescription}</p>
                    <h3 className="text-xl font-bold mb-3">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {campaign.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-blue-600">✓</span>
                          <span className="text-gray-700">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'updates' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Campaign Updates</h2>
                    {campaign.updates.length > 0 ? (
                      <div className="space-y-4">
                        {campaign.updates.map((u, i) => (
                          <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                            <p className="text-sm text-gray-500 mb-1">{u.date}</p>
                            <h4 className="font-semibold text-lg text-gray-900 mb-2">{u.title}</h4>
                            <p className="text-gray-700">{u.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-400 text-center py-8">No updates yet.</p>}
                  </div>
                )}
                {activeTab === 'documents' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Campaign Documents</h2>
                    {campaign.documents.length > 0 ? (
                      <div className="space-y-3">
                        {campaign.documents.map((doc, i) => (
                          <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📄</span>
                              <span className="font-semibold text-gray-700">{doc.name}</span>
                            </div>
                            <span className="text-blue-600">Download →</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">Documents will be available after your contribution is approved.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — Contribution Status Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-20">
              {renderContributionCard()}

              {/* Trust Indicators */}
              <div className="pt-6 mt-6 border-t border-gray-100">
                <div className="space-y-2">
                  {['Verified Campaign', 'Blockchain Secured', 'Regular Updates', `${campaign.investors} Investors Trust This`].map(t => (
                    <div key={t} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-600">✓</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
