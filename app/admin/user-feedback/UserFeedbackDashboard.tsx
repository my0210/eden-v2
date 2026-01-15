'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserFeedback, UserFeedbackStatus } from '@/lib/types';

const RATING_EMOJIS: Record<number, string> = {
  1: '😠',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😍',
};

const STATUS_COLORS: Record<UserFeedbackStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  reviewed: 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-green-500/20 text-green-400',
};

type FilterStatus = UserFeedbackStatus | 'all';

export function UserFeedbackDashboard() {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/admin/user-feedback');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (err) {
      setError('Failed to load feedback');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: UserFeedbackStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/user-feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      
      if (!res.ok) throw new Error('Failed to update');
      
      setFeedback(prev => 
        prev.map(f => f.id === id ? { ...f, status } : f)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(f => f.status === filter);

  const newCount = feedback.filter(f => f.status === 'new').length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 bg-background/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to App
          </Link>
          
          <h1 className="text-lg font-medium text-white/90">
            User Feedback
            {newCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                {newCount} new
              </span>
            )}
          </h1>
          
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            {(['all', 'new', 'reviewed', 'resolved'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${filter === status 
                    ? 'bg-white/15 text-white' 
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-1.5 text-white/30">
                    {feedback.filter(f => f.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-12 text-white/40">
              Loading feedback...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              {error}
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              No feedback {filter !== 'all' ? `with status "${filter}"` : 'yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl p-4 transition-all"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Rating */}
                      <span className="text-2xl" title={`Rating: ${item.rating}/5`}>
                        {RATING_EMOJIS[item.rating]}
                      </span>
                      
                      {/* User & Date */}
                      <div>
                        <p className="text-sm text-white/80">{item.userEmail}</p>
                        <p className="text-xs text-white/40">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value as UserFeedbackStatus)}
                      disabled={updatingId === item.id}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium
                        border-0 outline-none cursor-pointer
                        ${STATUS_COLORS[item.status]}
                        ${updatingId === item.id ? 'opacity-50' : ''}
                      `}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <option value="new" className="bg-[#1c1c1e] text-white">New</option>
                      <option value="reviewed" className="bg-[#1c1c1e] text-white">Reviewed</option>
                      <option value="resolved" className="bg-[#1c1c1e] text-white">Resolved</option>
                    </select>
                  </div>

                  {/* Message */}
                  {item.message && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="text-left w-full"
                      >
                        <p className={`
                          text-sm text-white/70
                          ${expandedId === item.id ? '' : 'line-clamp-2'}
                        `}>
                          {item.message}
                        </p>
                        {item.message.length > 100 && (
                          <span className="text-xs text-white/40 mt-1 inline-block">
                            {expandedId === item.id ? 'Show less' : 'Show more'}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
