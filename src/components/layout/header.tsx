'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

async function fetchNotifications() {
  const res = await fetch('/api/notifications');
  if (!res.ok) return { notifications: [] as Notification[], unreadCount: 0 };
  return res.json() as Promise<{ notifications: Notification[]; unreadCount: number }>;
}

export function Header({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications, refetchInterval: 30_000 });

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 px-5">
      <h1 className="text-base font-medium tracking-tight">{title}</h1>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {!!data?.unreadCount && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white" />
          )}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="glass-strong absolute right-0 top-11 w-80 rounded-lg p-2 shadow-elevate"
            >
              {!data?.notifications.length && (
                <p className="p-3 text-sm text-medium-gray">You're all caught up.</p>
              )}
              {data?.notifications.map((n) => (
                <div key={n.id} className="rounded-md p-3 text-sm hover:bg-white/5">
                  <p className={n.read ? 'text-medium-gray' : 'text-white'}>{n.message}</p>
                  <p className="mt-1 text-xs text-medium-gray">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
