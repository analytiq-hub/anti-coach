'use client';

import { useState, ReactNode, useEffect, Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSession } from '@/contexts/AppSessionContext';
import AuthButton from '@/components/AuthButton';
import UserMenu from '@/components/UserMenu';
import {
  Menu as Bars3Icon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  InfoOutlined as AboutIcon,
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';
import SidebarNavTooltip from '@/components/SidebarNavTooltip';

/** Kept for leftover DocRouter doc-viewer pages until those routes are removed. */
export interface PDFViewerControlsType {
  showLeftPanel: boolean;
  setShowLeftPanel: Dispatch<SetStateAction<boolean>>;
  showPdfPanel: boolean;
  setShowPdfPanel: Dispatch<SetStateAction<boolean>>;
  showChatPanel: boolean;
  setShowChatPanel: Dispatch<SetStateAction<boolean>>;
  isSmallScreen?: boolean;
}

interface MenuItem {
  text: string;
  icon: React.ComponentType<SvgIconProps>;
  href: string;
  tooltip: string;
}

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const { session, status } = useAppSession();
  const router = useRouter();
  const pathname = usePathname();
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/');

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      setTimeout(() => setOpen(JSON.parse(savedSidebarState)), 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(open));
  }, [open]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        const savedState = localStorage.getItem('sidebarOpen');
        if (savedState === null) {
          setOpen(false);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (
      status === 'unauthenticated' &&
      pathname !== '/' &&
      !pathname.startsWith('/auth/') &&
      !pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/chat')
    ) {
      router.push('/auth/signin');
    }
  }, [status, router, pathname]);

  const mainMenuItems: MenuItem[] =
    status === 'authenticated'
      ? [
          { text: 'Chat', icon: ChatIcon, tooltip: 'Chat', href: '/chat' },
          { text: 'Settings', icon: SettingsIcon, tooltip: 'Settings', href: '/settings' },
        ]
      : [];

  const systemMenuItems: MenuItem[] = [
    { text: 'About', icon: AboutIcon, tooltip: 'About', href: '/' },
  ];

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isSelected = pathname === item.href || pathname.startsWith(item.href + '/');

    const outerClasses = [
      'flex items-center h-10 w-full rounded-md',
      isSelected ? 'bg-blue-100' : 'hover:bg-blue-100',
      'transition-colors duration-200 px-3',
    ].join(' ');
    const iconWrapClasses = ['flex items-center justify-center', open ? 'w-6' : 'w-full'].join(' ');
    const labelClasses = [
      'ml-3 pr-3 pt-1 text-sm font-medium whitespace-nowrap',
      isSelected ? 'text-blue-600' : 'text-gray-700',
    ].join(' ');

    const content = (
      <div className={outerClasses}>
        <div className={iconWrapClasses}>
          <Icon className="h-6 w-6 shrink-0" />
        </div>
        {open && <span className={labelClasses}>{item.text}</span>}
      </div>
    );

    return (
      <SidebarNavTooltip key={item.text} label={item.tooltip} show={!open} className="px-2 py-1">
        <Link href={item.href} className="block" prefetch={false}>
          {content}
        </Link>
      </SidebarNavTooltip>
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="bg-blue-600 border-b border-blue-700">
        <div className="flex h-16 items-center justify-between px-3">
          <div className="flex shrink-0 items-center">
            <button onClick={() => setOpen(!open)} className="p-2 rounded-md hover:bg-blue-500">
              <Bars3Icon className="h-6 w-6 text-white" />
            </button>
            <Link
              href={session ? '/chat' : '/'}
              className={`${open ? 'ml-3' : 'ml-6'} text-xl font-semibold text-white`}
            >
              anti-coach
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session ? <UserMenu user={session?.user} /> : <AuthButton />}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isChatPage && (
          <aside
            className={`flex-shrink-0 transition-all duration-300 ease-in-out bg-blue-50 border-r border-gray-200 ${
              open ? 'w-48' : 'w-16 overflow-visible'
            }`}
          >
            <nav className={`flex h-full flex-col ${open ? 'overflow-hidden' : 'overflow-visible'}`}>
              {status === 'authenticated' && (
                <div className="py-1">{mainMenuItems.map(renderMenuItem)}</div>
              )}
              <hr className="border-gray-200 my-1" />
              <div className="py-1 mt-auto">{systemMenuItems.map(renderMenuItem)}</div>
            </nav>
          </aside>
        )}

        <main className={`flex-1 min-h-0 ${isChatPage ? 'overflow-hidden' : 'overflow-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
