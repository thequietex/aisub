# AiSub 🏆

A minimalist bounty platform where users solve puzzles to win USDC bounties equivalent to AI subscription costs.

## 🎯 Core Concept

- Users verify they're human via **Cloudflare Turnstile** (Captcha)
- Solve a riddle/puzzle
- **First correct answer wins** the bounty (USDC on Solana)
- Instant payout to winner's wallet

## ✨ Features

- **Ultra-minimalist UI** inspired by [solprice.now](https://solprice.now)
- **Race condition protection** - Atomic database updates ensure only one winner
- **Client-side answer hashing** - Prevents network inspection cheating
- **Instant USDC payouts** on Solana blockchain
- **Cloudflare Turnstile** integration for bot protection

## 🛠 Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Blockchain:** Solana Web3.js + Wallet Adapter
- **Database:** Supabase (PostgreSQL)
- **Security:** Cloudflare Turnstile
- **Payments:** SPL Token (USDC transfers)

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- A Cloudflare account for Turnstile ([cloudflare.com](https://cloudflare.com))
- A Solana wallet with USDC for bounties

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd aisub
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project
2. Go to the SQL Editor
3. Run the schema from `supabase-schema.sql`
4. Get your API keys from Settings > API

### 4. Set Up Cloudflare Turnstile

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Turnstile
3. Create a new site
4. Choose "Managed" mode
5. Copy your Site Key and Secret Key

### 5. Set Up Solana Treasury Wallet

```bash
# Generate a new wallet (or use existing)
solana-keygen new --outfile treasury-keypair.json

# Get the private key as array
cat treasury-keypair.json
# Copy the array of numbers
```

**Important:** Fund this wallet with USDC before launching!

### 6. Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in all the values:

```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Solana
TREASURY_PRIVATE_KEY=[123,45,67,89,...]  # Array from treasury-keypair.json
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
aisub/
├── app/
│   ├── api/
│   │   ├── bounty/route.ts      # Fetch current bounty
│   │   └── claim/route.ts        # Claim bounty (race-safe)
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── components/
│   ├── BountyHeader.tsx          # Bounty display
│   ├── CaptchaGuard.tsx          # Turnstile integration
│   ├── PuzzleArena.tsx           # Puzzle interface
│   └── WalletProvider.tsx        # Solana wallet context
├── lib/
│   ├── solanaAdmin.ts            # USDC transfer logic
│   └── supabase.ts               # Supabase client
├── utils/
│   └── hash.ts                   # Answer hashing
└── supabase-schema.sql           # Database schema
```

## 🎮 How It Works

### User Flow

1. **Connect Wallet** - User connects their Solana wallet (Phantom, Solflare, etc.)
2. **Verify Human** - Complete Cloudflare Turnstile captcha
3. **Solve Puzzle** - Read the riddle and enter the answer
4. **Win Bounty** - If correct and first, receive USDC instantly!

### Technical Flow

1. **Client-side hash check** prevents wrong answers from hitting the API
2. **API verifies captcha** with Cloudflare
3. **Atomic database update** ensures only one winner (race condition protection)
4. **USDC transfer** via Solana blockchain
5. **Confetti celebration** 🎉

## 🔒 Security Features

### Race Condition Protection

The claim endpoint uses an atomic SQL update:

```sql
UPDATE bounties
SET status = 'claimed', winner_wallet = '...'
WHERE id = '...' AND status = 'open'
```

If the `WHERE status = 'open'` condition fails, the update affects 0 rows, preventing double claims.

### Answer Protection

- Answers are hashed client-side (SHA-256)
- Only the hash is stored in the database
- Network inspection won't reveal the answer

### Bot Protection

- Cloudflare Turnstile verification required
- Server-side token validation
- IP tracking for rate limiting (optional)

## 🧪 Testing

### Create a Test Bounty

Use the Supabase SQL Editor:

```sql
INSERT INTO bounties (title, amount, riddle, answer_hash, expires_at)
VALUES (
  'Test Bounty',
  1.00,
  'What is 2 + 2?',
  '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', -- hash of "4"
  NOW() + INTERVAL '7 days'
);
```

### Generate Answer Hash

Use the browser console on your site:

```javascript
const hash = await window.crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode('your answer')
);
const hex = Array.from(new Uint8Array(hash))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');
console.log(hex);
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Important for Production

- Use a private Solana RPC endpoint (Helius, QuickNode, Alchemy)
- Enable Supabase Row Level Security (RLS)
- Set up proper CORS headers
- Monitor your treasury wallet balance
- Set up alerts for failed transactions

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## ⚠️ Disclaimer

This is a proof of concept. Use at your own risk. Ensure proper testing before handling real funds.

---

Built with ❤️ for the AI and crypto communities
