'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ProgressPhoto } from '@/lib/types';
import { ProgressPhotoUpload } from './ProgressPhotoUpload';
import { ProgressPhotoGallery } from './ProgressPhotoGallery';

interface ProgressPhotoSectionProps {
  userId: string;
}

// localStorage cache helpers
function getCachedPhotos(): ProgressPhoto[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('huuman_progress_photos');
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function setCachedPhotos(photos: ProgressPhoto[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('huuman_progress_photos', JSON.stringify(photos)); } catch {}
}

export function ProgressPhotoSection({ userId }: ProgressPhotoSectionProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const hasLoaded = useRef(false);

  // Fetch photos (stale-while-revalidate)
  useEffect(() => {
    // Show cached immediately
    const cached = getCachedPhotos();
    if (cached) {
      setPhotos(cached);
      setLoading(false);
      hasLoaded.current = true;
    }

    async function fetchPhotos() {
      try {
        const res = await fetch('/api/progress-photos');
        if (res.ok) {
          const data = await res.json();
          const fetched: ProgressPhoto[] = data.photos || [];
          setPhotos(fetched);
          setCachedPhotos(fetched);
        }
      } catch (error) {
        console.error('Failed to fetch progress photos:', error);
      } finally {
        setLoading(false);
        hasLoaded.current = true;
      }
    }

    fetchPhotos();
  }, [userId]);

  const handlePhotoUploaded = useCallback((photo: ProgressPhoto) => {
    setPhotos(prev => {
      const updated = [photo, ...prev];
      setCachedPhotos(updated);
      return updated;
    });
  }, []);

  const handlePhotoDeleted = useCallback(async (photoId: string) => {
    // Optimistic delete
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      setCachedPhotos(updated);
      return updated;
    });

    try {
      await fetch(`/api/progress-photos?id=${photoId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete photo:', error);
      // Refetch on error
      const res = await fetch('/api/progress-photos');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
        setCachedPhotos(data.photos || []);
      }
    }
  }, []);

  const handleAddFromGallery = useCallback(() => {
    setShowGallery(false);
    // Small delay so gallery close animation completes
    setTimeout(() => setShowUpload(true), 350);
  }, []);

  // Show minimal skeleton during first load
  if (loading && !hasLoaded.current) {
    return (
      <div className="mt-6">
        <div className="rounded-2xl p-4 animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-5 w-32 rounded bg-white/5 mb-3" />
          <div className="h-20 rounded-lg bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground/70">Progress Photos</h3>
          <button
            onClick={() => setShowUpload(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:text-green-400/80 transition-colors active:scale-95"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            aria-label="Add progress photo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
        </div>

        {photos.length === 0 ? (
          /* Empty state */
          <button
            onClick={() => setShowUpload(true)}
            className="w-full py-6 rounded-xl border border-dashed flex flex-col items-center gap-2 transition-colors hover:border-white/15 active:scale-[0.98]"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            {/* Body silhouette icon */}
            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <p className="text-xs text-white/35">Track your progress — take your first photo</p>
          </button>
        ) : (
          /* Horizontal thumbnail strip */
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {photos.slice(0, 10).map((photo) => (
              <button
                key={photo.id}
                onClick={() => setShowGallery(true)}
                className="flex-shrink-0 group active:scale-[0.96] transition-transform"
              >
                <div
                  className="w-[72px] h-[96px] rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  <img
                    src={photo.photoUrl}
                    alt={`Progress ${format(parseISO(photo.takenAt), 'MMM d')}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-[10px] text-foreground/35 mt-1 text-center">
                  {format(parseISO(photo.takenAt), 'MMM d')}
                </p>
              </button>
            ))}

            {/* "See all" if more than shown */}
            {photos.length > 10 && (
              <button
                onClick={() => setShowGallery(true)}
                className="flex-shrink-0 w-[72px] h-[96px] rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <span className="text-xs text-foreground/40">+{photos.length - 10}</span>
              </button>
            )}
          </div>
        )}

        {/* View All link when photos exist */}
        {photos.length > 0 && (
          <button
            onClick={() => setShowGallery(true)}
            className="w-full mt-3 py-2 text-xs text-foreground/40 hover:text-foreground/60 transition-colors flex items-center justify-center gap-1"
          >
            View all {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Upload Drawer */}
      <ProgressPhotoUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={handlePhotoUploaded}
      />

      {/* Gallery Overlay */}
      <ProgressPhotoGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        photos={photos}
        onDelete={handlePhotoDeleted}
        onAddNew={handleAddFromGallery}
      />
    </div>
  );
}
