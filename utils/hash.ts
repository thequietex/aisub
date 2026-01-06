/**
 * Simple SHA-256 hash utility for client-side answer validation
 * This prevents users from inspecting network requests to find the answer
 */

export async function hashAnswer(answer: string): Promise<string> {
  // Normalize the answer (lowercase, trim whitespace)
  const normalized = answer.toLowerCase().trim();

  // Convert string to ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);

  // Hash the data
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Verify if the user's answer matches the expected hash
 */
export async function verifyAnswerHash(answer: string, expectedHash: string): Promise<boolean> {
  const answerHash = await hashAnswer(answer);
  return answerHash === expectedHash;
}
