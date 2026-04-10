'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Investment {
  id: string;
  image: string;
  icon?: string;
  title: string;
  category: string;
  location: string;
  description: string;
  fullDescription: string;
  returns: string;
  duration: string;
  minInvestment: string;
  minInvestmentNumeric: number;
  maxInvestment?: string;
  totalSize: string;
  availableUnits: number;
  totalUnits: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  paymentSchedule: string;
  features: string[];
  financials: { label: string; value: string }[];
  documents: { name: string; url: string }[];
}

interface InvestmentRequest {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  admin_set_amount: number | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function InvestmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [selectedOption, setSelectedOption] = useState<'full' | 'partial'>('partial');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'documents'>('overview');

  // Request status state
  const [requestStatus, setRequestStatus] = useState<InvestmentRequest | null>(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error' | 'restricted'; msg: string } | null>(null);

  // ─── Fetch property ───────────────────────────────────────────────
  useEffect(() => {
    setInvestment(null);
    const fetchInvestment = async () => {
      try {
        const response = await fetch('/api/properties');
        const data = await response.json();
        if (data.success) {
          const property = data.properties.find((p: any) => p.id.toString() === params.id);
          if (property) {
            const investmentData: Investment = {
              id: property.id.toString(),
              image: property.image_url || '/images/property-placeholder.jpg',
              icon: '🏢',
              title: property.title,
              category:
                property.property_type === 'commercial' ? 'Commercial Real Estate' :
                  property.property_type === 'mixed' ? 'Mixed Use Development' :
                    property.property_type === 'residential' ? 'Residential Development' :
                      property.property_type === 'land' ? 'Land Investment' :
                        property.property_type === 'industrial' ? 'Industrial Real Estate' :
                          'Real Estate Investment',
              location: property.location,
              description: property.description || '',
              fullDescription: property.description || '',
              returns: property.returns || '12-15%',
              duration: property.duration || '3-5 Years',
              minInvestment: `PKR ${(property.min_investment || property.token_price || 100000).toLocaleString()}`,
              minInvestmentNumeric: property.min_investment || property.token_price || 100000,
              maxInvestment: `PKR ${(property.price || 10000000).toLocaleString()}`,
              totalSize: `PKR ${(property.price || 5000000).toLocaleString()}`,
              availableUnits: property.available_tokens || 1000,
              totalUnits: property.total_tokens || 1000,
              riskLevel: (property.risk_level || 'Low') as 'Low' | 'Medium' | 'High',
              paymentSchedule: property.payment_schedule || 'Quarterly',
              features: property.key_features || [],
              financials: [
                { label: 'Expected Annual Return', value: property.returns || '12-15%' },
                { label: 'Payment Schedule', value: property.payment_schedule || 'Quarterly' },
                { label: 'Risk Level', value: property.risk_level || 'Low' },
                { label: 'Duration', value: property.duration || '3-5 Years' },
                { label: 'Min Investment', value: `PKR ${(property.min_investment || 100000).toLocaleString()}` },
                { label: 'Property Type', value: property.property_type },
              ],
              documents: property.documents || [],
            };
            setInvestment(investmentData);
          }
        }
      } catch (error) {
        console.error('Error fetching investment:', error);
      }
    };
    fetchInvestment();
  }, [params.id]);

  // ─── Check user's existing request for THIS property ─────────────
  const checkRequestStatus = useCallback(async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { setCheckingStatus(false); return; }
    const userData = JSON.parse(storedUser);

    try {
      const res = await fetch(`/api/investments/request?user_id=${userData.id}&property_id=${params.id}`);
      const data = await res.json();
      if (data.success) {
        setIsRestricted(data.is_restricted);
        setRestrictionReason(data.restriction_reason || '');
        // Get the most recent request for this property
        if (data.requests && data.requests.length > 0) {
          setRequestStatus(data.requests[0]);
        } else {
          setRequestStatus(null);
        }
      }
    } catch (err) {
      console.error('Error checking request status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }, [params.id]);

  useEffect(() => {
    checkRequestStatus();
    // Poll every 8 seconds to catch status changes (admin approval)
    const iv = setInterval(checkRequestStatus, 8000);
    return () => clearInterval(iv);
  }, [checkRequestStatus]);

  // ─── Submit investment request ────────────────────────────────────
  const handleSubmitRequest = async () => {
    if (!investmentAmount && selectedOption === 'partial') {
      alert('Please enter an investment amount');
      return;
    }
    const amount = selectedOption === 'full'
      ? investment!.minInvestmentNumeric
      : parseInt(investmentAmount);

    if (selectedOption === 'partial' && amount < investment!.minInvestmentNumeric) {
      alert(`Minimum investment is ${investment!.minInvestment}`);
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) { alert('You must be logged in to invest.'); return; }
    const userData = JSON.parse(storedUser);

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/investments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.id,
          property_id: params.id,
          amount,
          property_title: investment!.title,
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
        setSubmitResult({
          type: 'success',
          msg: `Your investment request of PKR ${amount.toLocaleString()} has been submitted and is awaiting admin approval.`,
        });
        setInvestmentAmount('');
        // Refresh status to show "pending"
        await checkRequestStatus();
      } else {
        setSubmitResult({ type: 'error', msg: data.message || 'Failed to submit request. Try again.' });
      }
    } catch {
      setSubmitResult({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Proceed to checkout once approved ───────────────────────────
  const handleProceedToInvest = () => {
    const approvedAmount = requestStatus?.admin_set_amount || requestStatus?.amount || 0;
    router.push(`/checkout?investment=${params.id}&amount=${approvedAmount}&type=investment&request_id=${requestStatus?.id}`);
  };

  // ─── Loading state ───────────────────────────────────────────────
  if (!investment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading investment details...</p>
        </div>
      </div>
    );
  }

  const availabilityPercentage = (investment.availableUnits / investment.totalUnits) * 100;
  const approvedAmount = requestStatus?.admin_set_amount || requestStatus?.amount;
  const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

  // ─── Sidebar investment card content based on status ─────────────
  const renderInvestmentCard = () => {
    // 1. User is restricted
    if (isRestricted) {
      return (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-center">
          <div className="text-4xl mb-3">🚫</div>
          <h4 className="font-bold text-red-800 text-lg mb-2">Investing Restricted</h4>
          <p className="text-red-600 text-sm">{restrictionReason || 'Your account has been restricted from making investment requests. Please contact admin.'}</p>
        </div>
      );
    }

    // 2. Checking status
    if (checkingStatus) {
      return (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // 3. Request is APPROVED — show Invest Now
    if (requestStatus?.status === 'approved') {
      return (
        <div className="space-y-4">
          {/* Approved banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-emerald-800">Investment Approved!</p>
                <p className="text-xs text-emerald-600">Admin approved your request</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <p className="text-sm text-emerald-700">Approved Amount:</p>
              <p className="text-2xl font-bold text-emerald-700">{fmt(approvedAmount!)}</p>
              {requestStatus?.admin_set_amount && requestStatus.admin_set_amount !== requestStatus.amount && (
                <p className="text-xs text-emerald-600 mt-1">
                  (You requested {fmt(requestStatus.amount)}, admin set {fmt(requestStatus.admin_set_amount)})
                </p>
              )}
              {requestStatus?.admin_note && (
                <p className="mt-2 text-xs text-emerald-700 bg-emerald-100 p-2 rounded-lg">
                  Admin note: {requestStatus.admin_note}
                </p>
              )}
            </div>
          </div>

          {/* Proceed to invest button */}
          <button
            onClick={handleProceedToInvest}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            🚀 Invest Now — {fmt(approvedAmount!)}
          </button>

          <p className="text-center text-xs text-gray-400">
            Your investment request is approved. Click to proceed.
          </p>
        </div>
      );
    }

    // 4. Request is PENDING
    if (requestStatus?.status === 'pending') {
      return (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <h4 className="font-bold text-amber-800 text-lg mb-1">Request Pending</h4>
            <p className="text-amber-700 text-sm mb-3">
              Your investment request of <strong>{fmt(requestStatus.amount)}</strong> is awaiting admin review.
            </p>
            <p className="text-xs text-amber-600">
              Submitted: {new Date(requestStatus.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This page auto-refreshes. You'll see a green button as soon as admin approves.
          </div>
        </div>
      );
    }

    // 5. Request was REJECTED — let user submit again
    if (requestStatus?.status === 'rejected') {
      return (
        <div className="space-y-5">
          {/* Rejected notice */}
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-bold text-red-800">Request Rejected</p>
                <p className="text-xs text-red-600">
                  {new Date(requestStatus.reviewed_at || requestStatus.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {requestStatus.admin_note && (
              <p className="text-sm text-red-700 bg-red-100 p-2 rounded-lg mt-2">
                Reason: {requestStatus.admin_note}
              </p>
            )}
            <p className="mt-2 text-xs text-red-600">
              You can submit a new investment request below.
            </p>
          </div>

          {/* New request form */}
          {renderRequestForm('Re-submit Investment Request')}
        </div>
      );
    }

    // 6. No existing request — show form
    return renderRequestForm('Submit Investment Request');
  };

  const renderRequestForm = (buttonLabel: string) => (
    <div className="space-y-5">
      <h3 className="text-xl font-bold text-gray-900">Start Investing</h3>

      {/* Investment type selector */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Investment Type:</label>
        <button
          onClick={() => setSelectedOption('full')}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedOption === 'full' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-900">Full Investment</span>
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOption === 'full' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
              {selectedOption === 'full' && <span className="block w-2 h-2 rounded-full bg-white" />}
            </span>
          </div>
          <p className="text-sm text-gray-500">Min entry: {investment!.minInvestment}</p>
        </button>

        <button
          onClick={() => setSelectedOption('partial')}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedOption === 'partial' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-900">Custom Amount</span>
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOption === 'partial' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
              {selectedOption === 'partial' && <span className="block w-2 h-2 rounded-full bg-white" />}
            </span>
          </div>
          <p className="text-sm text-gray-500">Min: {investment!.minInvestment}</p>
        </button>
      </div>

      {/* Amount input */}
      {selectedOption === 'partial' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Investment Amount (PKR):</label>
          <input
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            placeholder={`Min ${investment!.minInvestment}`}
            min={investment!.minInvestmentNumeric}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {investmentAmount && parseInt(investmentAmount) >= investment!.minInvestmentNumeric && (
            <div className="mt-3 p-3 bg-green-50 rounded-xl">
              <p className="text-xs text-gray-600">Estimated Annual Return:</p>
              <p className="text-base font-bold text-green-600">
                PKR {(parseInt(investmentAmount) * 0.12).toLocaleString()} – {(parseInt(investmentAmount) * 0.15).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result banner */}
      {submitResult && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${submitResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : submitResult.type === 'restricted' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
          <p className="flex items-start gap-2">
            <span className="text-lg shrink-0">
              {submitResult.type === 'success' ? '✅' : submitResult.type === 'restricted' ? '🚫' : '⚠️'}
            </span>
            <span>{submitResult.msg}</span>
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmitRequest}
        disabled={submitting}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-base hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : buttonLabel}
      </button>
      <p className="text-center text-xs text-gray-400">⏳ Admin reviews & approves all requests</p>
    </div>
  );

  // ─── Main render ─────────────────────────────────────────────────
  return (
    <div key={params.id as string} className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-96 bg-gray-900">
        <Image
          src={investment.image}
          alt={investment.title}
          fill
          className="object-cover opacity-70"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
          <Link href="/investments" className="text-white hover:text-purple-400 mb-4 inline-block">← Back to Investments</Link>
          <div className="flex items-start gap-4">
            {investment.icon && <div className="text-6xl bg-white p-4 rounded-lg">{investment.icon}</div>}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{investment.title}</h1>
              <p className="text-gray-300 text-lg">{investment.category}</p>
              <p className="text-gray-400">{investment.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Returns</p>
                  <p className="text-2xl font-bold text-green-600">{investment.returns}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="text-2xl font-bold text-blue-600">{investment.duration}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Min. Investment</p>
                  <p className="text-lg font-bold text-purple-600">{investment.minInvestment}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Risk Level</p>
                  <p className={`text-2xl font-bold ${investment.riskLevel === 'Low' ? 'text-green-600' : investment.riskLevel === 'Medium' ? 'text-orange-600' : 'text-red-600'}`}>
                    {investment.riskLevel}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {(['overview', 'financials', 'documents'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-4 font-semibold capitalize ${activeTab === tab ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-purple-600'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Investment Overview</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">{investment.fullDescription}</p>
                    <h3 className="text-xl font-bold mb-3">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {investment.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span>
                          <span className="text-gray-700">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <h4 className="font-semibold text-blue-900 mb-2">Investment Highlights</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Payment Schedule: {investment.paymentSchedule}</li>
                        <li>• Total Investment Size: {investment.totalSize}</li>
                        <li>• Available Units: {investment.availableUnits.toLocaleString()} of {investment.totalUnits.toLocaleString()}</li>
                        <li>• Availability: {availabilityPercentage.toFixed(1)}%</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'financials' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Financial Details</h2>
                    <div className="space-y-3">
                      {investment.financials.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b">
                          <span className="font-semibold text-gray-700">{item.label}:</span>
                          <span className="text-gray-900 font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Risk Disclosure</h4>
                      <p className="text-sm text-yellow-800">
                        All investments carry risk. Past performance does not guarantee future results. Please read all documents carefully and consult with a financial advisor before investing.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Investment Documents</h2>
                    {investment.documents && investment.documents.length > 0 ? (
                      <div className="space-y-3">
                        {investment.documents.map((doc, i) => (
                          <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📄</span>
                              <span className="font-semibold text-gray-700">{doc.name}</span>
                            </div>
                            <span className="text-purple-600">Download →</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Documents Found</h3>
                        <p className="text-gray-500">Documents will be available after your investment is approved.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — Investment Status Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-20">
              {renderInvestmentCard()}

              {/* Trust Indicators */}
              <div className="pt-6 mt-6 border-t border-gray-100">
                <div className="space-y-2">
                  {['CDA Verified', 'Blockchain Secured', `${investment.paymentSchedule} Payments`, 'Professional Management'].map(t => (
                    <div key={t} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span>
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
