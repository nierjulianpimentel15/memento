'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize, Info, Trash2 } from 'lucide-react';
import type { GalleryPost } from '@/types/gallery';
import { CommentSection } from '@/components/posts/comment-section';
import { ReactionBar } from '@/components/posts/reaction-bar';

export function Lightbox({ post, onClose }: { post: GalleryPost; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const image = post.images[index];

  const deletePost = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not delete this post.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      onClose();
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  function handleDelete() {
    setDeleteError(null);
    if (window.confirm('Delete this post permanently? This removes it for everyone in the group.')) {
      deletePost.mutate();
    }
  }

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, post.images.length - 1)), [post.images.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  if (!image) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-black/95"
      >
        <div className="relative flex flex-1 flex-col">
          <div className="glass flex h-14 items-center justify-between border-b border-white/10 px-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatarUrl ?? undefined}
                alt=""
                className="h-7 w-7 rounded-full bg-dark-gray object-cover"
              />
              <div className="text-sm">
                <p className="font-medium leading-none">{post.author.displayName}</p>
                <p className="text-xs text-medium-gray">{new Date(post.takenAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <IconButton onClick={() => setZoomed((z) => !z)} label={zoomed ? 'Zoom out' : 'Zoom in'}>
                {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
              </IconButton>
              <IconButton onClick={toggleFullscreen} label="Fullscreen">
                <Maximize size={18} />
              </IconButton>
              <a href={image.originalUrl} download className="contents">
                <IconButton label="Download original">
                  <Download size={18} />
                </IconButton>
              </a>
              <IconButton onClick={() => setShowDetails((v) => !v)} label="Details">
                <Info size={18} />
              </IconButton>
              <IconButton onClick={handleDelete} label="Delete post">
                <Trash2 size={18} />
              </IconButton>
              <IconButton onClick={onClose} label="Close">
                <X size={18} />
              </IconButton>
            </div>
          </div>

          {deleteError && (
            <div className="border-b border-white/10 bg-red-950/30 px-4 py-2 text-xs text-light-gray">
              {deleteError}
            </div>
          )}

          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
            {index > 0 && (
              <NavArrow direction="left" onClick={prev} />
            )}
            <motion.img
              key={image.id}
              src={image.webUrl}
              alt={post.caption}
              className={zoomed ? 'max-h-[90vh] max-w-none cursor-zoom-out scale-150 object-contain transition-transform' : 'max-h-[85vh] max-w-full cursor-zoom-in object-contain transition-transform'}
              onClick={() => setZoomed((z) => !z)}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: zoomed ? 1.5 : 1 }}
              transition={{ duration: 0.25 }}
            />
            {index < post.images.length - 1 && (
              <NavArrow direction="right" onClick={next} />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
            <ReactionBar postId={post.id} />
            {post.caption && <p className="max-w-lg truncate text-sm text-light-gray">{post.caption}</p>}
          </div>
        </div>

        {showDetails && (
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            className="glass w-full max-w-sm border-l border-white/10 p-5 overflow-y-auto"
          >
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Detail label="Dimensions" value={`${image.width} × ${image.height}`} />
              <Detail label="Taken" value={new Date(post.takenAt).toLocaleString()} />
              {post.location && <Detail label="Location" value={post.location} />}
              <Detail label="Uploaded by" value={post.author.displayName} />
            </dl>
            <hr className="my-4 border-white/10" />
            <CommentSection postId={post.id} />
          </motion.aside>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-medium-gray">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-light-gray transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function NavArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous image' : 'Next image'}
      className={`glass absolute ${direction === 'left' ? 'left-4' : 'right-4'} top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/10`}
    >
      {direction === 'left' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}