'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { ProgressPhoto } from '@/lib/types';

interface ProgressPhotoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  photos: ProgressPhoto[];
  onDelete: (photoId: string) => void;
  onAddNew: () => void;
}

// Group photos by month
function groupByMonth(photos: ProgressPhoto[]): { label: string; photos: ProgressPhoto[] }[] {
  const groups: Record<string, ProgressPhoto[]> = {};
  
  for (const photo of photos) {
    const date = parseISO(photo.takenAt);
    const key = format(date, 'yyyy-MM');
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(photo);
  }
  
  // Sort by month descending
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, monthPhotos]) => ({
      label: format(parseISO(monthPhotos[0].takenAt), 'MMMM yyyy'),
      photos: monthPhotos,
    }));
}

function FullScreenPhoto({ 
  photo, 
  onClose, 
  onDelete 
}: { 
  photo: ProgressPhoto; 
  onClose: () => void; 
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    onDelete();
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex flex-col"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all
            ${confirmDelete 
              ? 'bg-red-500/30 border border-red-500/50 text-red-400' 
              : 'text-white/40 hover:text-red-400/80'
            }
          `}
        >
          {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete'}
        </button>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <img
          src={photo.photoUrl}
          alt={`Progress photo from ${format(parseISO(photo.takenAt), 'MMMM d, yyyy')}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>

      {/* Info */}
      <div className="px-6 py-4 flex-shrink-0 text-center safe-area-bottom">
        <p className="text-white/70 text-sm font-medium">
          {format(parseISO(photo.takenAt), 'MMMM d, yyyy')}
        </p>
        {photo.notes && (
          <p className="text-white/40 text-sm mt-1">&ldquo;{photo.notes}&rdquo;</p>
        )}
      </div>
    </div>
  );
}

export function ProgressPhotoGallery({ isOpen, onClose, photos, onDelete, onAddNew }: ProgressPhotoGalleryProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // Track mounting for portal
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Handle open/close with animation
  // Synchronous setState is intentional here to coordinate portal mount + CSS transition
  useEffect(() => {
    if (!mountedRef.current) return;
    let cancelled = false;
    if (isOpen) {
      // Must set render synchronously so the DOM element exists for the animation frame
      setShouldRender(true); // eslint-disable-line react-hooks/set-state-in-effect
      requestAnimationFrame(() => {
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (cancelled) return;
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        if (cancelled) return;
        setShouldRender(false);
        setSelectedPhoto(null);
      }, 300);
      return () => { cancelled = true; clearTimeout(timer); };
    }
    return () => { cancelled = true; };
  }, [isOpen]);

  // Handle swipe to close
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff > 0) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff > 100) {
      onClose();
    }
    setSwipeOffset(0);
  };

  const grouped = useMemo(() => groupByMonth(photos), [photos]);

  const handleDeletePhoto = (photoId: string) => {
    onDelete(photoId);
    setSelectedPhoto(null);
    setPhotoToDelete(null);
    setDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    setDeleting(true);
    handleDeletePhoto(photoToDelete);
  };

  if (!shouldRender) return null;

  const overlayContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0"
      style={{
        zIndex: 9999,
        backgroundColor: '#0a0a0a',
        transform: isAnimating
          ? `translateX(${swipeOffset}px)`
          : 'translateX(100%)',
        transition: swipeOffset > 0 ? 'none' : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b border-white/5"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-foreground/50 hover:text-foreground/70 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <span className="text-lg font-medium text-foreground/80">Progress Photos</span>

        <button
          onClick={onAddNew}
          className="w-9 h-9 rounded-full flex items-center justify-center text-green-400/70 hover:text-green-400 transition-colors"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 57px)' }}>
        {photos.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
            >
              <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-foreground/50 text-sm mb-1">No photos yet</p>
            <p className="text-foreground/30 text-xs mb-6">Take your first progress photo to start tracking.</p>
            <button
              onClick={onAddNew}
              className="px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-all active:scale-[0.97]"
            >
              Take Photo
            </button>
          </div>
        ) : (
          /* Photo grid grouped by month */
          <div className="px-4 py-4 space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-3">
                  {group.label}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {group.photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="w-full relative aspect-[3/4] rounded-xl overflow-hidden active:scale-[0.97] transition-transform"
                        style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.photoUrl}
                          alt={`Progress photo from ${format(parseISO(photo.takenAt), 'MMM d')}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Date overlay */}
                        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-white/80 text-xs font-medium">
                            {format(parseISO(photo.takenAt), 'MMM d')}
                          </p>
                          {photo.notes && (
                            <p className="text-white/40 text-[10px] truncate mt-0.5">
                              {photo.notes}
                            </p>
                          )}
                        </div>
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => setPhotoToDelete(photo.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white/50 active:scale-90 transition-all z-10"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
                        aria-label="Delete photo"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Bottom spacer */}
            <div className="h-8" />
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {photoToDelete && !selectedPhoto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center px-8"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => { setPhotoToDelete(null); setDeleting(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: 'rgba(28, 28, 30, 0.98)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white/90 text-base font-medium text-center">Delete this photo?</p>
            <p className="text-white/40 text-sm text-center">This can&apos;t be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setPhotoToDelete(null); setDeleting(false); }}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 transition-colors active:scale-[0.97]"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-red-400 transition-colors active:scale-[0.97]"
                style={{ backgroundColor: 'rgba(255, 59, 48, 0.15)' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen photo view */}
      {selectedPhoto && (
        <FullScreenPhoto
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={() => handleDeletePhoto(selectedPhoto.id)}
        />
      )}
    </div>
  );

  return createPortal(overlayContent, document.body);
}
