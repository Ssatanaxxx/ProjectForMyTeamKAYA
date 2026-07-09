import React from 'react';
import { UILogo } from '../components/UI/UILogo/UILogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { BackdropGlow } from './BackdropGlow';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-svh overflow-hidden bg-bg">
    <BackdropGlow />
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <UILogo />
      <ThemeToggle />
    </header>
    <main className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
      {children}
    </main>
  </div>
);
