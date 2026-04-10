'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MessageModal from '@/components/MessageModal';

interface Agent {
  id: number;
  user_id: number;
  name: string;
  initials: string;
  role: string;
  rating: number;
  location: string;
  experience: string;
  specialization: string;
  color: string;
  email?: string;
  phone?: string;
}

export default function PortfolioManagers() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [jitsiApi, setJitsiApi] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);

      // Redirect agents to their dashboard
      if (userData.user_type === 'agent' || userData.type === 'agent') {
        router.push('/agent-dashboard');
        return;
      }

      setUser(userData);
    }

    // Load Jitsi Meet API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch agents from API
    fetchAgents();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents');
      const data = await response.json();

      if (data.success && data.agents) {
        // Transform API data to match our Agent interface
        const transformedAgents = data.agents.map((agent: any, index: number) => ({
          id: agent.id,
          name: agent.full_name || 'Agent',
          initials: getInitials(agent.full_name || 'Agent'),
          role: agent.specialization || 'Real Estate Agent',
          rating: agent.rating || 4.5,
          location: `${agent.city}, Pakistan`,
          experience: agent.experience || '5+ years experience',
          specialization: agent.specialization || 'General Real Estate',
          color: getColorByIndex(index),
          user_id: agent.user_id,
          email: agent.email,
          phone: agent.phone,
        }));
        setAgents(transformedAgents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to sample data if API fails
      setAgents(getSampleAgents());
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorByIndex = (index: number): string => {
    const colors = [
      'from-teal-400 to-teal-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-green-400 to-green-600',
      'from-orange-400 to-orange-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-cyan-400 to-cyan-600',
    ];
    return colors[index % colors.length];
  };

  const getSampleAgents = (): Agent[] => {
    return [
      { id: 1, user_id: 2, name: 'Ahmed Khan', initials: 'AK', role: 'Senior Property Consultant', rating: 4.9, location: 'Islamabad, Pakistan', experience: '10+ years experience', specialization: 'Residential & Commercial', color: 'from-teal-400 to-teal-600' },
      { id: 2, user_id: 3, name: 'Sarah Ali', initials: 'SA', role: 'Investment Specialist', rating: 4.8, location: 'Karachi, Pakistan', experience: '8+ years experience', specialization: 'Luxury Properties', color: 'from-blue-400 to-blue-600' },
      { id: 3, user_id: 4, name: 'Muhammad Hassan', initials: 'MH', role: 'Commercial Real Estate Expert', rating: 5.0, location: 'Lahore, Pakistan', experience: '12+ years experience', specialization: 'Commercial & Industrial', color: 'from-purple-400 to-purple-600' },
    ];
  };


  const handleContactClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowContactModal(true);
  };

  const handleRateAgent = () => {
    setShowContactModal(false);
    setShowRatingModal(true);
  };

  const startVideoCall = async () => {
    if (!selectedAgent || !user) return;

    setShowContactModal(false);
    setShowVideoCall(true);

    const roomName = `PROPLEDGER_${selectedAgent.name.replace(/\s+/g, '_')}_${Date.now()}`;

    try {
      // Initiate call via Supabase API - this will notify the agent in real-time
      const response = await fetch('/api/video-calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_id: user.id,
          agent_id: selectedAgent.user_id.toString(),
          agent_name: selectedAgent.name,
          caller_name: user.full_name || user.name,
          room_id: roomName
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Failed to initiate call:', data.message);
        alert('Failed to initiate video call. Please try again.');
        setShowVideoCall(false);
        return;
      }

      console.log('Call initiated successfully:', data.call);
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Error initiating video call. Please try again.');
      setShowVideoCall(false);
      return;
    }

    // Initialize Jitsi Meet after call is recorded
    setTimeout(() => {
      if ((window as any).JitsiMeetExternalAPI) {
        const domain = 'meet.jit.si';

        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: document.querySelector('#jitsi-container'),
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ],
          },
          userInfo: {
            displayName: user?.name || 'Investor'
          }
        };

        const api = new (window as any).JitsiMeetExternalAPI(domain, options);
        setJitsiApi(api);

        // Event listeners
        api.addEventListener('videoConferenceJoined', () => {
          console.log('Video conference joined');
        });

        api.addEventListener('readyToClose', () => {
          endVideoCall();
        });
      }
    }, 100);
  };

  const endVideoCall = () => {
    if (jitsiApi) {
      jitsiApi.dispose();
      setJitsiApi(null);
    }
    setShowVideoCall(false);
  };

  const submitRating = () => {
    // Here you would send the rating to your backend
    console.log(`Rating ${userRating} stars for ${selectedAgent?.name}`);
    setShowRatingModal(false);
    setUserRating(0);
    setHoverRating(0);
    alert(`Thank you for rating ${selectedAgent?.name}!`);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>⭐</span>
        ))}
        <span className="text-gray-400 text-sm ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 relative bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNGI4YTYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMC0xMGMyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6TTYgMzRjMy4zMSAwIDYtMi42OSA2LTZzLTIuNjktNi02LTYtNiAyLjY5LTYgNiAyLjY5IDYgNiA2em0wLTEwYzIuMjEgMCA0IDEuNzkgNCA0cy0xLjc5IDQtNCA0LTQtMS43OS00LTQgMS43OS00IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Our Portfolio Managers
            </h1>
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              Connect with experienced real estate agents to guide your investment journey
            </p>
            <p className="text-gray-600">
              Our certified portfolio managers specialize in blockchain-secured real estate investments,
              offering personalized strategies and expert guidance for your property portfolio.
            </p>
          </div>
        </div>
      </section>

      {/* Agents Grid Section */}
      <section className="py-16 bg-gray-950">
        <div className="container mx-auto px-4">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
              <p className="text-white mt-4">Loading portfolio managers...</p>
            </div>
          )}

          {/* No Agents State */}
          {!loading && agents.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-white mb-2">No Portfolio Managers Available</h3>
              <p className="text-gray-400">Check back soon for available agents.</p>
            </div>
          )}

          {/* Agents Grid */}
          {!loading && agents.length > 0 && (
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:border-teal-500 transition-all">
                  <div className="text-center mb-4">
                    <div className={`w-24 h-24 bg-gradient-to-br ${agent.color} rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold`}>
                      {agent.initials}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
                    <p className="text-teal-400 text-sm mb-2">{agent.role}</p>
                    {renderStars(agent.rating)}
                  </div>
                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <p className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{agent.location}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>💼</span>
                      <span>{agent.experience}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🏆</span>
                      <span>{agent.specialization}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleContactClick(agent)}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Contact Agent
                  </button>
                </div>
              ))}

            </div>
          )}

          {/* Why Choose Our Managers Section */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 mt-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Why Choose Our Portfolio Managers?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎓</div>
                <h3 className="text-lg font-bold text-white mb-2">Certified Experts</h3>
                <p className="text-gray-400 text-sm">All managers are CDA-certified with proven track records in real estate investment</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-white mb-2">24/7 Support</h3>
                <p className="text-gray-400 text-sm">Video calls, messaging, and online meeting scheduling available anytime</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-white mb-2">Personalized Strategy</h3>
                <p className="text-gray-400 text-sm">Tailored investment plans based on your goals and risk profile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      {showContactModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 bg-gradient-to-br ${selectedAgent.color} rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold`}>
                {selectedAgent.initials}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{selectedAgent.name}</h3>
              <p className="text-teal-400 text-sm">{selectedAgent.role}</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setShowMessageModal(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <span className="text-xl">💬</span>
                <span>Send Message</span>
              </button>

              <button
                onClick={startVideoCall}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <span className="text-xl">📹</span>
                <span>Start Video Call</span>
              </button>

              <button
                onClick={handleRateAgent}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <span className="text-xl">⭐</span>
                <span>Rate Agent</span>
              </button>
            </div>

            <button
              onClick={() => setShowContactModal(false)}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && selectedAgent && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${selectedAgent.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                {selectedAgent.initials}
              </div>
              <div>
                <h3 className="text-white font-bold">{selectedAgent.name}</h3>
                <p className="text-gray-400 text-sm">Video Call in Progress</p>
              </div>
            </div>
            <button
              onClick={endVideoCall}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>📞</span>
              <span>End Call</span>
            </button>
          </div>
          <div id="jitsi-container" className="flex-1 w-full"></div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 bg-gradient-to-br ${selectedAgent.color} rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold`}>
                {selectedAgent.initials}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Rate {selectedAgent.name}</h3>
              <p className="text-gray-400 text-sm">How was your experience?</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-5xl transition-transform hover:scale-110"
                >
                  <span className={star <= (hoverRating || userRating) ? 'text-yellow-400' : 'text-gray-600'}>
                    ⭐
                  </span>
                </button>
              ))}
            </div>

            {userRating > 0 && (
              <div className="text-center mb-6">
                <p className="text-white text-lg font-medium">
                  {userRating === 5 && 'Excellent! 🎉'}
                  {userRating === 4 && 'Great! 👍'}
                  {userRating === 3 && 'Good 👌'}
                  {userRating === 2 && 'Fair 😐'}
                  {userRating === 1 && 'Needs Improvement 😕'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={submitRating}
                disabled={userRating === 0}
                className={`w-full py-3 rounded-lg font-medium transition-all ${userRating > 0
                  ? 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Submit Rating
              </button>

              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setUserRating(0);
                  setHoverRating(0);
                }}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedAgent && user && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          agent={{
            id: selectedAgent.id,
            name: selectedAgent.name,
            initials: selectedAgent.initials,
            color: selectedAgent.color,
            userId: selectedAgent.user_id,
          }}
          user={user}
        />
      )}

      <Footer />
    </div>
  );
}
