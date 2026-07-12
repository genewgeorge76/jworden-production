import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function Root() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
