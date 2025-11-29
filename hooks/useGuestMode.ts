'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';

export function useGuestMode() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    if (loading) return;
    const guestViewParam = searchParams.get('GuestView');
    const hasGuestView = guestViewParam === '1';

    setIsGuestMode(!user || hasGuestView);
  }, [user, loading, searchParams]);

  return { isGuestMode, isLoading: loading };
}