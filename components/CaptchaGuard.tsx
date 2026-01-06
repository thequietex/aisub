'use client';

import { useEffect, useRef } from 'react';

interface CaptchaGuardProps {
  onVerified: (token: string) => void;
  siteKey: string;
}

export function CaptchaGuard({ onVerified, siteKey }: CaptchaGuardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load Cloudflare Turnstile script
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderTurnstile();
      };
    } else {
      renderTurnstile();
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  const renderTurnstile = () => {
    if (!(window as any).turnstile || !containerRef.current) {
      setTimeout(renderTurnstile, 100);
      return;
    }

    // Clear any existing widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Render Turnstile widget
    widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'dark',
      callback: (token: string) => {
        onVerified(token);
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="text-center space-y-2">
        <div className="text-sm uppercase tracking-widest text-gray-500">
          Step 1: Verify
        </div>
        <div className="text-2xl text-gray-300">
          Prove you&apos;re human
        </div>
      </div>

      <div ref={containerRef} className="flex justify-center" />

      <div className="text-xs text-gray-600 max-w-md text-center">
        Complete the verification to unlock the puzzle
      </div>
    </div>
  );
}
