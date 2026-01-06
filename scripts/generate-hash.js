#!/usr/bin/env node

/**
 * Simple script to generate answer hashes for bounties
 * Usage: node scripts/generate-hash.js "your answer"
 */

const crypto = require('crypto');

const answer = process.argv[2];

if (!answer) {
  console.error('Usage: node scripts/generate-hash.js "your answer"');
  process.exit(1);
}

// Normalize the answer (lowercase, trim)
const normalized = answer.toLowerCase().trim();

// Generate SHA-256 hash
const hash = crypto.createHash('sha256').update(normalized).digest('hex');

console.log('\n🔐 Answer Hash Generator\n');
console.log('Answer:', normalized);
console.log('Hash:', hash);
console.log('\nUse this hash in your Supabase bounty insert statement.');
console.log('Example:');
console.log(`
INSERT INTO bounties (title, amount, riddle, answer_hash, expires_at)
VALUES (
  'Claude Pro',
  20.00,
  'Your riddle here',
  '${hash}',
  NOW() + INTERVAL '30 days'
);
`);
