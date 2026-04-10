'use client';

import { useState } from 'react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    id: number;
    name: string;
    initials: string;
    color: string;
    userId?: number;
  };
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export default function MessageModal({ isOpen, onClose, agent, user }: MessageModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please login to send messages');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        manager: agent.name,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        agent_id: agent.userId ?? agent.id,
        user_id: user.id.toString(), // Include user_id for localStorage auth
      };

      console.log('Sending message to agent:', payload);

      // Send to Next.js API route instead of PHP
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Message send response:', data);

      if (data.success) {
        setSuccess(true);
        setFormData({ subject: '', message: '', priority: 'normal' });
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Message send error:', err);
      setError('Connection error. Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${agent.color} rounded-full flex items-center justify-center text-white text-lg font-bold`}>
              {agent.initials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Send Message to {agent.name}</h3>
              <p className="text-gray-400 text-sm">Portfolio Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>Message sent successfully! The agent will reply soon.</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-white font-medium mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="e.g., Property Investment Inquiry"
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-white font-medium mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-white font-medium mb-2">
              Message *
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
              placeholder="Type your message here..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || success}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${loading || success
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-lg'
                }`}
            >
              {loading ? 'Sending...' : success ? 'Sent!' : 'Send Message'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
