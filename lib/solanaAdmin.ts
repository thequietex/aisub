import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';

// USDC Mint Address on Solana Mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Solana RPC endpoint
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

/**
 * Transfer USDC from treasury wallet to winner's wallet
 */
export async function transferUSDC(
  recipientAddress: string,
  amount: number
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    // Get treasury private key from environment
    const treasuryPrivateKeyString = process.env.TREASURY_PRIVATE_KEY;
    if (!treasuryPrivateKeyString) {
      throw new Error('Treasury private key not configured');
    }

    // Parse private key (expects base58 or array of numbers)
    const treasuryKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(treasuryPrivateKeyString))
    );

    // Create connection
    const connection = new Connection(SOLANA_RPC, 'confirmed');

    // Parse recipient address
    const recipientPublicKey = new PublicKey(recipientAddress);

    // Convert amount to USDC's smallest unit (6 decimals)
    const amountInSmallestUnit = amount * 1_000_000;

    // Get or create associated token accounts
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair,
      USDC_MINT,
      treasuryKeypair.publicKey
    );

    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair,
      USDC_MINT,
      recipientPublicKey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      treasuryTokenAccount.address,
      recipientTokenAccount.address,
      treasuryKeypair.publicKey,
      amountInSmallestUnit
    );

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryKeypair],
      {
        commitment: 'confirmed',
      }
    );

    return {
      success: true,
      signature,
    };
  } catch (error) {
    console.error('USDC transfer failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify a Solana wallet address is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
