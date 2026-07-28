import React from 'react';

interface ContainProps {
  children: React.ReactNode;
}

export default function Contain({ children }: ContainProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-12 md:px-24 py-16 z-10 max-w-none mx-auto w-full text-center space-y-24">
      {children}
    </main>
  );
}
