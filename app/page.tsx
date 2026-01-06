'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Confetti from 'react-confetti';
import { WalletProvider } from '@/components/WalletProvider';
import { BountyHeader } from '@/components/BountyHeader';
import { CaptchaGuard } from '@/components/CaptchaGuard';
import { PuzzleArena } from '@/components/PuzzleArena';
import { Bounty } from '@/lib/supabase';

function HomeContent() {
  const { publicKey, connected } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch the current bounty
  useEffect(() => {
    fetchBounty();
  }, []);

  const fetchBounty = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/bounty');

      if (!response.ok) {
        throw new Error('Failed to fetch bounty');
      }

      const data = await response.json();
      setBounty(data.bounty);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaVerified = (token: string) => {
    setCaptchaToken(token);
  };

  const handleSuccess = (signature: string) => {
    setShowConfetti(true);
    setSuccessMessage(
      `🎉 Congratulations! You won! Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`
    );
    // Refresh bounty status
    setTimeout(() => {
      fetchBounty();
    }, 2000);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setTimeout(() => setError(null), 5000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  // No bounty available
  if (!bounty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🏆</div>
          <div className="text-2xl text-gray-400">No active bounty</div>
          <div className="text-gray-600">Check back soon!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Confetti on success */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Header with Wallet Button */}
      <div className="absolute top-0 right-0 p-6">
        <WalletMultiButton className="!bg-white !text-black hover:!bg-gray-200 !font-mono !text-sm !rounded-lg" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-16">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-lg text-center max-w-2xl">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg text-center max-w-2xl">
            {error}
          </div>
        )}

        {/* Bounty Header */}
        <BountyHeader bounty={bounty} />

        {/* Conditional Rendering based on state */}
        <div className="w-full max-w-3xl">
          {bounty.status !== 'open' ? (
            // Bounty already claimed or expired
            <div className="text-center space-y-4">
              <div className="text-6xl">
                {bounty.status === 'claimed' ? '🏆' : '⏰'}
              </div>
              <div className="text-2xl text-gray-400">
                {bounty.status === 'claimed'
                  ? 'Bounty Claimed!'
                  : 'Bounty Expired'}
              </div>
              {bounty.winner_wallet && (
                <div className="text-gray-600">
                  Winner: {bounty.winner_wallet.slice(0, 4)}...
                  {bounty.winner_wallet.slice(-4)}
                </div>
              )}
            </div>
          ) : !connected ? (
            // Wallet not connected
            <div className="text-center space-y-6">
              <div className="text-xl text-gray-400">
                Connect your Solana wallet to participate
              </div>
              <div className="text-gray-600">
                Click the button in the top right corner
              </div>
            </div>
          ) : !captchaToken ? (
            // Captcha not completed
            <CaptchaGuard
              onVerified={handleCaptchaVerified}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
            />
          ) : (
            // Puzzle unlocked
            <PuzzleArena
              bounty={bounty}
              captchaToken={captchaToken}
              walletAddress={publicKey!.toBase58()}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-gray-700">
        <div className="space-y-1">
          <div>AiSub - Solve puzzles, win AI subscriptions</div>
          <div className="text-gray-800">
            First correct answer wins. USDC sent instantly on Solana.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <WalletProvider>
      <HomeContent />
    </WalletProvider>
  );
}
