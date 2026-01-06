import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { transferUSDC, isValidSolanaAddress } from '@/lib/solanaAdmin';
import { verifyAnswerHash } from '@/utils/hash';

interface ClaimRequest {
  bountyId: string;
  walletAddress: string;
  answer: string;
  captchaToken: string;
}

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    return false;
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip: ip,
        }),
      }
    );

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Captcha verification failed:', error);
    return false;
  }
}

/**
 * POST /api/claim
 * Handle bounty claiming with race condition protection
 */
export async function POST(request: NextRequest) {
  try {
    const body: ClaimRequest = await request.json();
    const { bountyId, walletAddress, answer, captchaToken } = body;

    // Validate input
    if (!bountyId || !walletAddress || !answer || !captchaToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate Solana wallet address
    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Solana wallet address' },
        { status: 400 }
      );
    }

    // Get IP address for captcha verification
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    // Step 1: Verify Captcha
    const captchaValid = await verifyCaptcha(captchaToken, ip);
    if (!captchaValid) {
      return NextResponse.json(
        { error: 'Captcha verification failed. Please try again.' },
        { status: 403 }
      );
    }

    // Step 2: Get Supabase admin client
    const supabase = getSupabaseAdmin();

    // Step 3: Fetch the bounty
    const { data: bounty, error: fetchError } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', bountyId)
      .single();

    if (fetchError || !bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    // Step 4: Check if bounty is still open
    if (bounty.status !== 'open') {
      return NextResponse.json(
        {
          error:
            bounty.status === 'claimed'
              ? 'Bounty already claimed by someone else!'
              : 'Bounty is no longer available',
        },
        { status: 409 }
      );
    }

    // Step 5: Verify the answer (server-side double-check)
    const isCorrect = await verifyAnswerHash(answer, bounty.answer_hash);
    if (!isCorrect) {
      // Log the attempt (optional, for analytics)
      await supabase.from('bounty_attempts').insert({
        bounty_id: bountyId,
        wallet_address: walletAddress,
        captcha_token: captchaToken,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || null,
      });

      return NextResponse.json(
        { error: 'Incorrect answer' },
        { status: 400 }
      );
    }

    // Step 6: Atomic claim - update bounty status with WHERE condition
    // This is the critical race condition protection!
    const { data: updateData, error: updateError } = await supabase
      .from('bounties')
      .update({
        status: 'claimed',
        winner_wallet: walletAddress,
      })
      .eq('id', bountyId)
      .eq('status', 'open') // Critical: only update if still open
      .select();

    // If update affected 0 rows, someone else claimed it first
    if (!updateData || updateData.length === 0) {
      return NextResponse.json(
        { error: 'Bounty was claimed by someone else just now!' },
        { status: 409 }
      );
    }

    if (updateError) {
      console.error('Failed to update bounty:', updateError);
      return NextResponse.json(
        { error: 'Failed to claim bounty' },
        { status: 500 }
      );
    }

    // Step 7: Extract amount from reward_text (e.g., "$20 USDC - Claude Pro")
    const amountMatch = bounty.reward_text.match(/\$(\d+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 20; // Default to 20 if parsing fails

    // Step 8: Transfer USDC to winner
    const transferResult = await transferUSDC(walletAddress, amount);

    if (!transferResult.success) {
      // Rollback the claim if transfer fails
      await supabase
        .from('bounties')
        .update({
          status: 'open',
          winner_wallet: null,
        })
        .eq('id', bountyId);

      return NextResponse.json(
        {
          error: `Payment failed: ${transferResult.error}. Please try again or contact support.`,
        },
        { status: 500 }
      );
    }

    // Step 9: Update bounty with transaction signature
    await supabase
      .from('bounties')
      .update({
        txn_signature: transferResult.signature,
      })
      .eq('id', bountyId);

    // Step 9: Log successful attempt
    await supabase.from('bounty_attempts').insert({
      bounty_id: bountyId,
      wallet_address: walletAddress,
      captcha_token: captchaToken,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || null,
    });

    // Success!
    return NextResponse.json(
      {
        success: true,
        message: 'Bounty claimed successfully!',
        signature: transferResult.signature,
        reward: bounty.reward_text,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error claiming bounty:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
