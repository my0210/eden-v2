'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

type NavigationDirection = 'forward' | 'back';

export function useViewTransition() {
  const router = useRouter();

  const navigate = useCallback((href: string, direction: NavigationDirection = 'forward') => {
    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback: regular navigation
      if (direction === 'back') {
        router.back();
      } else {
        router.push(href);
      }
      return;
    }

    // Set direction class for CSS to pick up
    if (direction === 'back') {
      document.documentElement.classList.add('view-transition-back');
    } else {
      document.documentElement.classList.remove('view-transition-back');
    }

    // Start view transition
    document.startViewTransition(() => {
      if (direction === 'back') {
        router.back();
      } else {
        router.push(href);
      }
    });
  }, [router]);

  const navigateForward = useCallback((href: string) => {
    navigate(href, 'forward');
  }, [navigate]);

  const navigateBack = useCallback((href?: string) => {
    navigate(href || '', 'back');
  }, [navigate]);

  return { navigate, navigateForward, navigateBack };
}
