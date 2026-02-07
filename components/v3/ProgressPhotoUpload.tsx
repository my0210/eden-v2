'use client';

import { useState, useRef } from 'react';
import { Drawer } from 'vaul';

import { ProgressPhoto } from '@/lib/types';

interface ProgressPhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (photo: ProgressPhoto) => void;
}

// Client-side image compression: resize to max 1200px wide, output as JPEG
async function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

export function ProgressPhotoUpload({ isOpen, onClose, onUploaded }: ProgressPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPreview(null);
    setSelectedFile(null);
    setTakenAt(new Date().toISOString().split('T')[0]);
    setNotes('');
    setUploading(false);
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Delay reset to allow close animation
      setTimeout(resetState, 300);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image is too large. Max 20MB before compression.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Compress image client-side
      const compressed = await compressImage(selectedFile);

      const formData = new FormData();
      formData.append('photo', compressed, 'progress.jpg');
      formData.append('takenAt', takenAt);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const res = await fetch('/api/progress-photos', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      onUploaded(data.photo);
      onClose();
      setTimeout(resetState, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-[100]"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />

        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none"
          style={{
            height: '75vh',
            maxHeight: '75vh',
            backgroundColor: 'var(--background-secondary)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderBottom: 'none',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div
              className="w-9 h-1 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
            <Drawer.Title className="text-white/80 text-base font-medium">
              New Photo
            </Drawer.Title>
            <Drawer.Close asChild>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Drawer.Close>
          </div>

          {/* Divider */}
          <div className="h-px mx-5 flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-y-auto overscroll-contain px-5 py-5">
            {/* Image Preview / Selector — takes remaining space */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex-1 mb-4 min-h-0">
              {preview ? (
                <div className="w-full h-full rounded-2xl overflow-hidden relative flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  {/* Persistent retake button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white/80 transition-all active:scale-95"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 transition-colors hover:border-white/15 active:scale-[0.99]"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                  >
                    <svg className="w-7 h-7 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white/40 font-medium">Take or Choose Photo</p>
                    <p className="text-xs text-white/20 mt-1">Full body works best</p>
                  </div>
                </button>
              )}
            </div>

            {/* Bottom section — always pinned at bottom */}
            <div className="flex-shrink-0 space-y-3">
              {/* Date */}
              <div>
                <label className="text-[11px] text-white/30 mb-1 block uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-white/15"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', colorScheme: 'dark' }}
                />
              </div>
              {/* Note */}
              <div>
                <label className="text-[11px] text-white/30 mb-1 block uppercase tracking-wider">Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Week 6..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/15"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400/70 text-xs">{error}</p>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`
                  w-full py-3 rounded-2xl text-sm font-medium
                  transition-all duration-150 active:scale-[0.98]
                  ${selectedFile && !uploading
                    ? 'text-white/90'
                    : 'text-white/20 cursor-not-allowed'
                  }
                `}
                style={{
                  backgroundColor: selectedFile && !uploading
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: selectedFile && !uploading
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>

          {/* Safe area */}
          <div className="h-4 flex-shrink-0 safe-area-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
