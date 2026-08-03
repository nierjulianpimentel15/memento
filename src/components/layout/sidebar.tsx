'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Images, Users, Clock, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/groups', label: 'Gallery', icon: Images, match: '/gallery' },
  { href: '/groups', label: 'Memories', icon: Clock, match: '/memories' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const groupId = pathname?.match(/\/groups\/([^/]+)/)?.[1];

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="hidden w-60 flex-col justify-between border-r border-white/10 bg-near-black/60 p-4 md:flex">
      <div>
        <Link href="/groups" className="mb-8 block px-2 text-lg font-semibold tracking-tight">
          Memento
        </Link>
        <nav className="space-y-1">
          <SidebarLink href="/groups" label="Your groups" icon={Users} active={pathname === '/groups'} />
          {groupId && (
            <>
              <SidebarLink
                href={`/groups/${groupId}/gallery`}
                label="Gallery"
                icon={Images}
                active={pathname?.includes('/gallery') ?? false}
              />
              <SidebarLink
                href={`/groups/${groupId}/memories`}
                label="Memories"
                icon={Clock}
                active={pathname?.includes('/memories') ?? false}
              />
              <SidebarLink
                href={`/groups/${groupId}/settings`}
                label="Settings"
                icon={Settings}
                active={pathname?.includes('/settings') ?? false}
              />
            </>
          )}
        </nav>
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-medium-gray transition-colors hover:bg-white/5 hover:text-white"
      >
        <LogOut size={16} /> Sign out
      </button>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Users;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
        active ? 'bg-white/10 text-white' : 'text-medium-gray hover:bg-white/5 hover:text-white'
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
