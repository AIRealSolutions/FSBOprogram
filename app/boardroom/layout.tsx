'use client';

import AuthGate from '@/components/AuthGate';

export default function BoardroomLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}

