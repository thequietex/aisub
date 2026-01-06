'use client';

import { useState } from 'react';
import { Bounty } from '@/lib/supabase';
import { verifyAnswerHash } from '@/utils/hash';

interface PuzzleArenaProps {
  bounty: Bounty;
  captchaToken: string;
  walletAddress: string;
  onSuccess: (signature: string) => void;
  onError: (error: string) => void;
}

export function PuzzleArena({
  bounty,
  captchaToken,
  walletAddress,
  onSuccess,
  onError,
}: PuzzleArenaProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      onError('Please enter an answer');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Client-side hash verification
      const isCorrect = await verifyAnswerHash(answer, bounty.answer_hash);

      if (!isCorrect) {
        onError('Incorrect answer. Try again!');
        setIsSubmitting(false);
        return;
      }

      // Step 2: Submit to backend for claiming
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bountyId: bounty.id,
          walletAddress,
          answer,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim bounty');
      }

      // Success!
      onSuccess(data.signature);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Puzzle Header */}
      <div className="text-center space-y-2">
        <div className="text-sm uppercase tracking-widest text-gray-500">
          Step 2: Solve
        </div>
        <div className="text-2xl text-gray-300">
          Answer the riddle
        </div>
      </div>

      {/* The Riddle */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-lg">
        <div className="text-lg md:text-xl text-gray-300 leading-relaxed text-center italic">
          &ldquo;{bounty.riddle}&rdquo;
        </div>
      </div>

      {/* Answer Input */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer..."
            disabled={isSubmitting}
            className="w-full bg-black border-2 border-white/20 text-white text-2xl md:text-3xl text-center py-6 px-8 rounded-lg focus:outline-none focus:border-white/60 transition-colors disabled:opacity-50 font-mono tracking-wider placeholder:text-gray-700"
            autoFocus
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !answer.trim()}
          className="w-full bg-white text-black py-6 px-8 rounded-lg text-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Claim Bounty'}
        </button>
      </form>

      {/* Wallet Info */}
      <div className="text-center text-xs text-gray-600">
        Winning wallet: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
      </div>
    </div>
  );
}
