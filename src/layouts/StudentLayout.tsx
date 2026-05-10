import React from 'react';
import { MobileNav } from '../components/student/MobileNav';

interface StudentLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const StudentLayout = ({ children, activeTab, onTabChange }: StudentLayoutProps) => {
  return (
    <div className="min-h-screen bg-bg-cream flex flex-col">
      <main className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
      <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
