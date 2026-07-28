import React from 'react';
import { Terminal, BookOpen } from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark' | 'blue';
  cycleTheme: () => void;
  themeConfig: any;
}

export default function Navbar({ theme, cycleTheme, themeConfig }: NavbarProps) {
  const handlePortalEnter = (hashPath: string) => {
    window.location.hash = hashPath;
  };

  return (
    <header className="px-8 py-4 flex items-center justify-between border-b border-app-border bg-app-header backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-wider text-app-text-h">TblInc Cloud</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => handlePortalEnter('#docs')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-app-text-h hover:text-purple-400 transition cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Docs</span>
        </button>

        <button
          onClick={() => handlePortalEnter('#login')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 hover:text-app-text-h transition cursor-pointer"
        >
          <span>Log in</span>
        </button>

        <button
          onClick={() => handlePortalEnter('#login')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <span>Sign up</span>
        </button>

        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-card hover:bg-app-border-dim border border-app-border text-app-text transition-all cursor-pointer text-xs font-bold ml-2"
          title={`Theme: ${themeConfig[theme].label} → click for ${themeConfig[theme].next}`}
        >
          {themeConfig[theme].icon}
          <span className="hidden sm:inline text-app-text-h">{themeConfig[theme].label}</span>
        </button>
      </div>
    </header>
  );
}
