'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart } from 'lucide-react';
import type { GalleryPost } from '@/types/gallery';

interface MasonryGalleryProps {
  posts: GalleryPost[];
  onOpenPost: (post: GalleryPost) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isFetchingMore: boolean;
}

export function MasonryGallery({ posts, onOpenPost, onLoadMore, hasMore, isFetchingMore }: MasonryGalleryProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="font-medium">No photos yet</p>
        <p className="text-sm text-medium-gray">Upload the first memory to get this gallery started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="masonry-columns columns-2 sm:columns-3 lg:columns-4">
        {posts.map((post, i) => {
          const cover = post.images[0];
          if (!cover) return null;
          return (
            <motion.button
              key={post.id}
              onClick={() => onOpenPost(post)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: (i % 12) * 0.03 }}
              className="masonry-item group relative block w-full overflow-hidden rounded-lg text-left"
              style={{ aspectRatio: `${cover.width} / ${cover.height}` }}
            >
              <img
                src={cover.thumbnailUrl}
                alt={post.caption || 'Shared memory'}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {post.images.length > 1 && (
                <span className="glass absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px]">
                  +{post.images.length - 1}
                </span>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="flex items-center gap-1">
                  <Heart size={13} /> {post._count.reactions}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={13} /> {post._count.comments}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
      <div ref={sentinelRef} className="h-10" />
      {isFetchingMore && <p className="py-4 text-center text-xs text-medium-gray">Loading more…</p>}
    </div>
  );
}
