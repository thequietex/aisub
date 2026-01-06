-- AiSub Bounty Platform - Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Bounties table
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Bounty details
  title TEXT NOT NULL, -- e.g., "Claude Pro"
  amount DECIMAL(10, 2) NOT NULL, -- e.g., 20.00 (USDC)
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'claimed' | 'expired'

  -- Puzzle details
  riddle TEXT NOT NULL,
  answer_hash TEXT NOT NULL, -- SHA-256 hash of the correct answer

  -- Winner details (null until claimed)
  winner_wallet TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  transaction_signature TEXT,

  -- Metadata
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('open', 'claimed', 'expired'))
);

-- Attempts table (optional - for analytics)
CREATE TABLE IF NOT EXISTS bounty_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  bounty_id UUID REFERENCES bounties(id),
  wallet_address TEXT NOT NULL,
  captcha_token TEXT,

  -- For rate limiting and analytics
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_bounty_id ON bounty_attempts(bounty_id);
CREATE INDEX IF NOT EXISTS idx_attempts_wallet ON bounty_attempts(wallet_address);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample bounty (you can modify this)
INSERT INTO bounties (title, amount, riddle, answer_hash, expires_at)
VALUES (
  'Claude Pro',
  20.00,
  'I am the beginning of eternity, the end of time and space. I am essential to creation, and I surround every place. What am I?',
  'e1671797c52e15f763380b45e841ec32', -- SHA-256 hash of "e" (the letter)
  NOW() + INTERVAL '30 days'
);

-- RLS (Row Level Security) - Optional but recommended
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_attempts ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access to bounties"
  ON bounties FOR SELECT
  USING (true);

-- Only allow service role to insert/update bounties
CREATE POLICY "Allow service role to manage bounties"
  ON bounties FOR ALL
  USING (auth.role() = 'service_role');

-- Allow public to insert attempts (for analytics)
CREATE POLICY "Allow public to insert attempts"
  ON bounty_attempts FOR INSERT
  WITH CHECK (true);
