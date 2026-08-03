'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Images, Users, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const groupId = pathname?.match(/\/groups\/([^/]+)/)?.[1];

  const items = [
    { href: '/groups', label: 'Groups', icon: Users, active: pathname === '/groups' },
    {
      href: groupId ? `/groups/${groupId}/gallery` : '/groups',
      label: 'Gallery',
      icon: Images,
      active: pathname?.includes('/gallery') ?? false,
    },
    {
      href: groupId ? `/groups/${groupId}/memories` : '/groups',
      label: 'Memories',
      icon: Clock,
      active: pathname?.includes('/memories') ?? false,
    },
    {
      href: groupId ? `/groups/${groupId}/settings` : '/groups',
      label: 'Settings',
      icon: Settings,
      active: pathname?.includes('/settings') ?? false,
    },
  ];

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 px-2 py-2 md:hidden">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            'flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-[11px]',
            item.active ? 'text-white' : 'text-medium-gray'
          )}
        >
          <item.icon size={20} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
