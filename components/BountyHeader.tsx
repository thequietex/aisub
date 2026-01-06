import { Bounty } from '@/lib/supabase';

interface BountyHeaderProps {
  bounty: Bounty;
}

export function BountyHeader({ bounty }: BountyHeaderProps) {
  return (
    <div className="text-center space-y-4">
      {/* Minimalist branding */}
      <h1 className="text-sm uppercase tracking-widest text-gray-500">
        AiSub
      </h1>

      {/* Massive bounty display - inspired by solprice.now */}
      <div className="space-y-2">
        <div className="text-8xl md:text-9xl font-bold tracking-tighter">
          ${bounty.amount}
        </div>
        <div className="text-2xl md:text-3xl text-gray-400 tracking-wide">
          USDC
        </div>
      </div>

      {/* Subscription title */}
      <div className="text-xl md:text-2xl text-gray-300 tracking-wide">
        {bounty.title}
      </div>

      {/* Status indicator */}
      <div className="inline-block">
        <div
          className={`px-4 py-2 text-sm uppercase tracking-widest ${
            bounty.status === 'open'
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : bounty.status === 'claimed'
              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
          }`}
        >
          {bounty.status}
        </div>
      </div>
    </div>
  );
}
