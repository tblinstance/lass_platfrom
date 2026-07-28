import React from 'react';

interface SideNavProps {
  onNavigate: (hash: string) => void;
}

export default function SideNav({ onNavigate }: SideNavProps) {
  const links = [
    { label: 'Home', hash: '' },
    { label: 'Docs', hash: '#docs' },
    { label: 'Marketplace', hash: '#portal' },
    { label: 'Log in', hash: '#login' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-app-border bg-app-header/50 backdrop-blur-md p-6 gap-2 min-h-screen shrink-0">
      <nav className="space-y-1 mt-4">
        {links.map((link) => (
          <button
            key={link.label}
            onClick={() => onNavigate(link.hash)}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-app-text-h hover:bg-app-card/50 transition cursor-pointer"
          >
            {link.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
