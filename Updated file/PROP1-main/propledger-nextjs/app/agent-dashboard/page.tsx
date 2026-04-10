'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface User {
  id: number;
  name: string;
  email: string;
  type: string;
}

interface Message {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  reply_message?: string;
  replied_at?: string;
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [jitsiApi, setJitsiApi] = useState<any>(null);

  useEffect(() => {
    // Load Jitsi Meet API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();

      // Auto-refresh messages every 30 seconds
      const interval = setInterval(() => {
        fetchMessages();
        checkIncomingCalls();
      }, 5000); // Check every 5 seconds for calls

      return () => clearInterval(interval);
    }
  }, [user]);

  const checkIncomingCalls = async () => {
    if (!user) return;
    try {
      // Use Supabase-based API to check for pending video calls
      const response = await fetch(`/api/video-calls/check?agent_id=${user.id}`);
      const data = await response.json();

      if (data.success && data.calls && data.calls.length > 0) {
        // Get the most recent call
        const latestCall = data.calls[0];
        setIncomingCall(latestCall);
      }
    } catch (error) {
      console.error('Error checking incoming calls:', error);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      // Update call status to active
      await fetch('/api/video-calls/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: incomingCall.id,
          status: 'active'
        })
      });

      // Start Jitsi video call
      if ((window as any).JitsiMeetExternalAPI) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: incomingCall.room_id,
          width: '100%',
          height: '100%',
          parentNode: document.querySelector('#agent-jitsi-container'),
          userInfo: {
            displayName: user?.name || 'Agent'
          }
        };
        const api = new (window as any).JitsiMeetExternalAPI(domain, options);
        setJitsiApi(api);

        api.addEventListener('readyToClose', () => {
          endCall();
        });
      }
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      await fetch('/api/video-calls/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: incomingCall.id,
          status: 'rejected'
        })
      });

      setIncomingCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
      setIncomingCall(null);
    }
  };

  const endCall = async () => {
    if (jitsiApi) {
      jitsiApi.dispose();
      setJitsiApi(null);
    }
    if (incomingCall) {
      try {
        await fetch('/api/video-calls/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            call_id: incomingCall.id,
            status: 'ended'
          })
        });
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    setIncomingCall(null);
  };

  const fetchMessages = async () => {
    if (!user) return;

    setMessagesLoading(true);
    try {
      // Include agent_name as query parameter for localStorage auth
      const response = await fetch(`/api/messages/agent?agent_name=${encodeURIComponent(user.name)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      console.log('Agent messages response:', data); // Debug log
      console.log('Agent info:', user); // Debug agent info

      if (data.debug) {
        console.log('Backend debug info:', data.debug);
      }

      if (data.success && data.messages) {
        console.log(`Found ${data.messages.length} messages for agent`);
        console.log('Sample message:', data.messages[0]); // Debug to see what fields we have
        setMessages(data.messages);

        // Count unread messages
        const unread = data.messages.filter((msg: Message) => msg.status === 'unread').length;
        setUnreadCount(unread);
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleReply = async (messageId: number, userId: number) => {
    if (!replyText.trim()) return;

    try {
      const response = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          reply_message: replyText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReplyingTo(null);
        setReplyText('');
        fetchMessages(); // Refresh messages
      } else {
        alert('Failed to send reply: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply. Please try again.');
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      const response = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId }),
      });

      const data = await response.json();

      if (data.success) {
        fetchMessages(); // Refresh messages to show updated status
      } else {
        alert('Failed to mark as read: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      alert('Error marking message as read. Please try again.');
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

        // Verify user is an agent
        if (userData.user_type !== 'agent' && userData.type !== 'agent') {
          router.push('/dashboard');
          return;
        }

        setUser({
          id: userData.id,
          name: userData.full_name || userData.name,
          email: userData.email,
          type: userData.user_type || userData.type
        });

        // Sync with PHP backend session
        await syncPHPSession(userData.id);

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
        // Verify user is an agent
        if (data.user.user_type !== 'agent' && data.user.type !== 'agent') {
          router.push('/dashboard');
          return;
        }

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

  const syncPHPSession = async (userId: number) => {
    try {
      const response = await fetch('http://localhost/PROPLEDGER/auth/sync_session.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();
      console.log('PHP session sync:', data);

      if (!data.success) {
        console.error('Failed to sync PHP session:', data.message);
      }
    } catch (error) {
      console.error('Error syncing PHP session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-dark">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 mb-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
            Welcome, Agent {user?.name}!
          </h1>
          <p className="text-white/90 drop-shadow-sm">
            Manage your clients, properties, and commissions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-teal-500/20 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Clients</div>
            <div className="text-3xl font-bold text-white">0</div>
            <div className="text-green-400 text-sm mt-2">+0 this month</div>
          </div>
          <div className="bg-gray-800 border border-blue-500/20 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Active Listings</div>
            <div className="text-3xl font-bold text-white">0</div>
            <div className="text-gray-400 text-sm mt-2">Properties listed</div>
          </div>
          <div className="bg-gray-800 border border-purple-500/20 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Unread Messages</div>
            <div className="text-3xl font-bold text-white">{unreadCount}</div>
            <div className={`text-sm mt-2 ${unreadCount > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
              {unreadCount > 0 ? 'Requires attention!' : 'All caught up'}
            </div>
          </div>
          <div className="bg-gray-800 border border-yellow-500/20 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Messages</div>
            <div className="text-3xl font-bold text-white">{messages.length}</div>
            <div className="text-gray-400 text-sm mt-2">All time</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Clients</h3>
            <p className="text-gray-400 text-sm">View and communicate with your clients</p>
          </div>
          <div className="bg-gray-800 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition-colors cursor-pointer">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">View Reports</h3>
            <p className="text-gray-400 text-sm">Track your performance and earnings</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400">No recent activity</p>
            <p className="text-gray-500 text-sm mt-2">Your client interactions will appear here</p>
          </div>
        </div>

        {/* Client Messages */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Client Messages</h2>
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </div>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>

          {messagesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
              <p className="text-gray-400 mt-4">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-500 text-sm mt-2">Messages from your clients will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bg-gray-700 border ${msg.status === 'unread' ? 'border-teal-500' : 'border-gray-600'} rounded-lg p-4`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold">{msg.subject}</h3>
                      {msg.status === 'unread' && (
                        <span className="px-2 py-1 bg-teal-500 text-white text-xs rounded-full">New</span>
                      )}
                      {msg.status === 'replied' && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Replied</span>
                      )}
                      {msg.priority === 'high' && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">High Priority</span>
                      )}
                      {msg.priority === 'urgent' && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">Urgent</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    From: {msg.user_name || 'Client'} ({msg.user_email || 'N/A'})
                  </p>
                  <p className="text-gray-300 mb-3">{msg.message}</p>

                  {msg.reply_message ? (
                    <div className="mt-4 pl-4 border-l-4 border-green-500 bg-gray-800 p-3 rounded">
                      <p className="text-green-400 text-sm font-bold mb-1">Your Reply:</p>
                      <p className="text-gray-300">{msg.reply_message}</p>
                      {msg.replied_at && (
                        <p className="text-gray-500 text-xs mt-2">Sent on {new Date(msg.replied_at).toLocaleString()}</p>
                      )}
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : replyingTo === msg.id ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(msg.id, msg.user_id)}
                          className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Send Reply
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setReplyingTo(msg.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        💬 Reply to Client
                      </button>
                      {msg.status === 'unread' && (
                        <button
                          onClick={() => handleMarkAsRead(msg.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          ✓ Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Incoming Call Modal */}
      {incomingCall && !jitsiApi && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center animate-bounce-subtle">
            <div className="w-24 h-24 bg-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
              <span className="text-4xl">📹</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Incoming Video Call</h3>
            <p className="text-gray-300 mb-6">
              {incomingCall.caller_name || 'Client'} is calling you...
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={rejectCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-transform hover:scale-105"
              >
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold transition-transform hover:scale-105 animate-pulse"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Modal */}
      {jitsiApi && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
            <h3 className="text-white font-bold">Video Call with {incomingCall?.caller_name}</h3>
            <button
              onClick={endCall}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              End Call
            </button>
          </div>
          <div id="agent-jitsi-container" className="flex-1 w-full"></div>
        </div>
      )}
    </div>
  );
}
