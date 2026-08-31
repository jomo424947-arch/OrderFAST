'use client';

import React from 'react';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { StudentBottomNav } from '@/components/layout/StudentBottomNav';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <StudentHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-12">
        {children}
      </main>
      <StudentBottomNav />
    </div>
  );
}
